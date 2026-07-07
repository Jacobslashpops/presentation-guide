#!/usr/bin/env python3
"""
YouTube Channel Scraper
Extracts channel info and latest videos from YouTube channel pages.

Usage:
    python youtube_scraper.py https://www.youtube.com/@AlHuTV
    python youtube_scraper.py https://www.youtube.com/@andremartinyt
"""

import sys
import re
import json
import urllib.parse
import urllib.request


def fetch_page(url):
    """Fetch YouTube page with proper headers."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode('utf-8')


def extract_yt_initial_data(html):
    """Extract ytInitialData JSON from HTML."""
    match = re.search(r'ytInitialData\s*=\s*({.+?});\s*</script>', html, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return None


def get_avatar_high_res(avatar_url):
    """Get highest resolution avatar URL."""
    if not avatar_url:
        return None
    base = avatar_url.split('=s')[0] if '=s' in avatar_url else avatar_url
    return f"{base}=s800-c-k-c0x00ffffff-no-rj"


def extract_redirect_url(redirect_url):
    """Extract actual URL from YouTube redirect URL."""
    parsed = urllib.parse.urlparse(redirect_url)
    params = urllib.parse.parse_qs(parsed.query)
    return params.get('q', [''])[0]


def parse_video_from_renderer(renderer):
    """Extract video info from a video renderer using AI-like flexible parsing."""
    video = {
        'video_id': None,
        'title': None,
        'description': None,
        'thumbnail_url': None,
        'duration': None,
        'view_count': None,
        'published_at': None,
        'video_url': None,
    }

    # Handle new lockupViewModel format (YouTube 2025)
    if 'lockupViewModel' in renderer:
        lockup = renderer['lockupViewModel']

        # Video ID from contentId
        video['video_id'] = lockup.get('contentId')
        if video['video_id']:
            video['video_url'] = f"https://www.youtube.com/watch?v={video['video_id']}"

        # Title from metadata
        metadata = lockup.get('metadata', {}).get('lockupMetadataViewModel', {})
        title_data = metadata.get('title', {})
        video['title'] = title_data.get('content')

        # Thumbnails from contentImage
        thumbnails = lockup.get('contentImage', {}).get('thumbnailViewModel', {}).get('image', {}).get('sources', [])
        if thumbnails:
            best = max(thumbnails, key=lambda x: x.get('width', 0) * x.get('height', 0))
            video['thumbnail_url'] = best.get('url')

        # Duration from overlay badges
        overlays = lockup.get('contentImage', {}).get('thumbnailViewModel', {}).get('overlays', [])
        for overlay in overlays:
            badge = overlay.get('thumbnailBottomOverlayViewModel', {}).get('badges', [{}])[0].get('thumbnailBadgeViewModel', {})
            if badge.get('text'):
                video['duration'] = badge.get('text')
                break

        # View count and published date from metadata rows
        meta_rows = metadata.get('metadata', {}).get('contentMetadataViewModel', {}).get('metadataRows', [])
        for row in meta_rows:
            parts = row.get('metadataParts', [])
            if len(parts) >= 1:
                video['view_count'] = parts[0].get('text', {}).get('content')
            if len(parts) >= 2:
                video['published_at'] = parts[1].get('text', {}).get('content')

        return video

    # Legacy videoRenderer / gridVideoRenderer format
    # Try multiple possible paths for video ID
    video_id_paths = [
        lambda r: r.get('videoId'),
        lambda r: r.get('navigationEndpoint', {}).get('watchEndpoint', {}).get('videoId'),
        lambda r: r.get('commandMetadata', {}).get('webCommandMetadata', {}).get('url', '').split('?v=')[-1] if '?v=' in r.get('commandMetadata', {}).get('webCommandMetadata', {}).get('url', '') else None,
    ]

    for path_fn in video_id_paths:
        vid = path_fn(renderer)
        if vid:
            video['video_id'] = vid
            video['video_url'] = f"https://www.youtube.com/watch?v={vid}"
            break

    # Try multiple paths for title
    title_paths = [
        lambda r: r.get('title', {}).get('runs', [{}])[0].get('text') if isinstance(r.get('title'), dict) else None,
        lambda r: r.get('title', {}).get('simpleText') if isinstance(r.get('title'), dict) else None,
        lambda r: r.get('headline', {}).get('simpleText') if isinstance(r.get('headline'), dict) else None,
        lambda r: r.get('headline', {}).get('runs', [{}])[0].get('text') if isinstance(r.get('headline'), dict) else None,
    ]

    for path_fn in title_paths:
        title = path_fn(renderer)
        if title:
            video['title'] = title
            break

    # Thumbnail - try to get highest res
    thumbnails = renderer.get('thumbnail', {}).get('thumbnails', [])
    if thumbnails:
        best = max(thumbnails, key=lambda x: x.get('width', 0) * x.get('height', 0))
        video['thumbnail_url'] = best.get('url')

    # Duration
    duration_paths = [
        lambda r: r.get('lengthText', {}).get('simpleText'),
        lambda r: r.get('lengthText', {}).get('runs', [{}])[0].get('text'),
        lambda r: r.get('timeText', {}).get('simpleText'),
    ]
    for path_fn in duration_paths:
        dur = path_fn(renderer)
        if dur:
            video['duration'] = dur
            break

    # View count / published time
    overlay = renderer.get('publishedTimeText', {})
    if isinstance(overlay, dict):
        video['published_at'] = overlay.get('simpleText') or overlay.get('runs', [{}])[0].get('text')
    elif isinstance(overlay, str):
        video['published_at'] = overlay

    view_text = renderer.get('viewCountText', {})
    if isinstance(view_text, dict):
        video['view_count'] = view_text.get('simpleText') or view_text.get('runs', [{}])[0].get('text')
    elif isinstance(view_text, str):
        video['view_count'] = view_text

    # Description snippet
    desc = renderer.get('descriptionSnippet', {})
    if isinstance(desc, dict):
        runs = desc.get('runs', [])
        video['description'] = ''.join(r.get('text', '') for r in runs)

    return video


def scrape_videos(channel_url, max_videos=10):
    """Scrape latest videos from channel's videos page."""
    if not channel_url.endswith('/'):
        channel_url += '/'

    videos_html = fetch_page(f"{channel_url}videos")
    videos_data = extract_yt_initial_data(videos_html)

    if not videos_data:
        return []

    videos = []

    # Navigate through the nested structure to find video renderers
    # This uses a flexible, AI-like approach that tries multiple paths
    contents_paths = [
        # Path 1: Standard tab renderer
        lambda d: d.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', []),
        # Path 2: Rich grid
        lambda d: d.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', []),
    ]

    for path_fn in contents_paths:
        tabs = path_fn(videos_data)
        if not tabs:
            continue

        for tab in tabs:
            tab_renderer = tab.get('tabRenderer') or tab.get('expandableTabRenderer', {})

            # Check for videos tab by URL path (new format) or tabIdentifier (old format)
            endpoint = tab_renderer.get('endpoint', {}).get('commandMetadata', {}).get('webCommandMetadata', {})
            url_path = endpoint.get('url', '')
            is_videos_tab = '/videos' in url_path or tab_renderer.get('tabIdentifier') == 'VIDEOS'

            if not is_videos_tab:
                continue

            content = tab_renderer.get('content', {})

            # Try to find the rich grid renderer
            rich_grid = content.get('richGridRenderer', {})
            if rich_grid:
                items = rich_grid.get('contents', [])
                for item in items:
                    # Skip continuation items
                    if 'continuationItemRenderer' in item:
                        continue

                    content_inner = item.get('richItemRenderer', {}).get('content', {})
                    video = parse_video_from_renderer(content_inner)
                    if video['video_id'] and video['title']:
                        videos.append(video)

                    if len(videos) >= max_videos:
                        break

            # Alternative: section list renderer with item section
            if not videos:
                section_list = content.get('sectionListRenderer', {})
                contents = section_list.get('contents', [])
                for section in contents:
                    item_section = section.get('itemSectionRenderer', {})
                    items = item_section.get('contents', [])
                    for item in items:
                        video_renderer = item.get('videoRenderer', {})
                        if not video_renderer:
                            # Try grid video renderer
                            video_renderer = item.get('gridVideoRenderer', {})

                        if video_renderer:
                            video = parse_video_from_renderer(video_renderer)
                            if video['video_id'] and video['title']:
                                videos.append(video)

                            if len(videos) >= max_videos:
                                break

            break  # Found the VIDEOS tab

        if videos:
            break

    return videos


def scrape_channel(channel_url):
    """Scrape YouTube channel data."""
    if not channel_url.endswith('/'):
        channel_url += '/'

    main_html = fetch_page(channel_url)
    main_data = extract_yt_initial_data(main_html)

    if not main_data:
        raise ValueError("Could not extract channel data from main page")

    about_html = fetch_page(f"{channel_url}about")
    about_data = extract_yt_initial_data(about_html)

    result = {
        'name': None,
        'handle': None,
        'avatar_url': None,
        'subscriber_count': None,
        'video_count': None,
        'view_count': None,
        'description': None,
        'email': None,
        'location': None,
        'joined_date': None,
        'channel_url': channel_url,
        'channel_id': None,
        'rss_url': None,
        'social_links': {},
        'platforms': ['YouTube'],
        'videos': [],
    }

    # Extract from main page header
    header = main_data.get('header', {}).get('pageHeaderRenderer', {})
    content = header.get('content', {}).get('pageHeaderViewModel', {})

    title_data = content.get('title', {}).get('dynamicTextViewModel', {}).get('text', {})
    result['name'] = title_data.get('content', '')

    metadata = main_data.get('metadata', {}).get('channelMetadataRenderer', {})
    result['handle'] = metadata.get('vanityChannelUrl', '').split('/')[-1] if metadata.get('vanityChannelUrl') else None
    result['channel_id'] = metadata.get('externalId')
    result['rss_url'] = metadata.get('rssUrl')

    image_data = content.get('image', {}).get('decoratedAvatarViewModel', {}).get('avatar', {}).get('avatarViewModel', {}).get('image', {}).get('sources', [])
    if image_data:
        best = max(image_data, key=lambda x: x.get('width', 0))
        result['avatar_url'] = get_avatar_high_res(best.get('url'))

    meta_rows = content.get('metadata', {}).get('contentMetadataViewModel', {}).get('metadataRows', [])
    for row in meta_rows:
        for part in row.get('metadataParts', []):
            text = part.get('text', {}).get('content', '')
            if 'subscribers' in text.lower() or 'subscriber' in text.lower():
                result['subscriber_count'] = text
            elif text.startswith('@'):
                result['handle'] = text

    # Extract from about page
    if about_data:
        endpoints = about_data.get('onResponseReceivedEndpoints', [])
        for ep in endpoints:
            panel = ep.get('showEngagementPanelEndpoint', {}).get('engagementPanel', {}).get('engagementPanelSectionListRenderer', {})
            if 'content' in panel:
                section_list = panel['content'].get('sectionListRenderer', {})
                contents = section_list.get('contents', [])

                for item in contents:
                    if 'itemSectionRenderer' in item:
                        items = item['itemSectionRenderer'].get('contents', [])
                        for si in items:
                            if 'aboutChannelRenderer' in si:
                                renderer = si['aboutChannelRenderer']
                                about_meta = renderer.get('metadata', {}).get('aboutChannelViewModel', {})

                                result['description'] = about_meta.get('description', '')
                                result['view_count'] = about_meta.get('viewCountText', '')

                                joined = about_meta.get('joinedDateText', '')
                                result['joined_date'] = joined.get('content', '') if isinstance(joined, dict) else joined

                                result['location'] = about_meta.get('country', '')
                                result['video_count'] = about_meta.get('videoCountText', '')

                                subs = about_meta.get('subscriberCountText', '')
                                if subs:
                                    result['subscriber_count'] = subs

                                links = about_meta.get('links', [])
                                for link in links:
                                    link_data = link.get('channelExternalLinkViewModel', {})
                                    title = link_data.get('title', {}).get('content', '')
                                    link_content = link_data.get('link', {}).get('content', '')

                                    command_runs = link_data.get('link', {}).get('commandRuns', [])
                                    actual_url = None
                                    for run in command_runs:
                                        on_tap = run.get('onTap', {}).get('innertubeCommand', {})
                                        url_endpoint = on_tap.get('urlEndpoint', {})
                                        if url_endpoint.get('url', '').startswith('https://www.youtube.com/redirect'):
                                            actual_url = extract_redirect_url(url_endpoint['url'])
                                            break

                                    if not actual_url and link_content:
                                        if not link_content.startswith('http'):
                                            actual_url = f"https://{link_content}"
                                        else:
                                            actual_url = link_content

                                    if title and actual_url:
                                        result['social_links'][title] = actual_url
                                        platform_name = title.capitalize()
                                        if platform_name not in result['platforms']:
                                            result['platforms'].append(platform_name)

                                if result['description']:
                                    email_match = __import__('re').search(r'[\w.+-]+@[\w-]+\.[\w.-]+', result['description'])
                                    if email_match:
                                        result['email'] = email_match.group(0)

                                break

    # Parse subscriber count
    if result['subscriber_count']:
        sub_text = result['subscriber_count'].lower()
        num_match = __import__('re').search(r'([\d.]+)\s*([km]?)', sub_text.replace(',', ''))
        if num_match:
            num = float(num_match.group(1))
            unit = num_match.group(2)
            if unit == 'k':
                result['followers_count'] = int(num * 1000)
            elif unit == 'm':
                result['followers_count'] = int(num * 1000000)
            else:
                result['followers_count'] = int(num)
        else:
            result['followers_count'] = None
    else:
        result['followers_count'] = None

    # Scrape latest videos
    print("Fetching latest videos...")
    result['videos'] = scrape_videos(channel_url, max_videos=10)
    print(f"Found {len(result['videos'])} videos")

    return result


def format_for_platform(data):
    """Format scraped data for CelePulse platform insertion."""
    return {
        'display_name': data['name'],
        'email': data['email'],
        'avatar_url': data['avatar_url'],
        'platform': data['platforms'],
        'followers_count': data['followers_count'],
        'bio': data['description'][:500] if data['description'] else None,
        'timezone': 'Europe/Berlin',
        'status': 'active',
        'channel_urls': data['social_links'],
        'youtube_url': data['channel_url'],
        'youtube_subscribers': data['subscriber_count'],
        'youtube_videos': data['video_count'],
        'youtube_views': data['view_count'],
        'location': data['location'],
        'joined_date': data['joined_date'],
        'videos': data['videos'],
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python youtube_scraper.py <youtube_channel_url>")
        print("Example: python youtube_scraper.py https://www.youtube.com/@AlHuTV")
        sys.exit(1)

    channel_url = sys.argv[1]

    try:
        print(f"Scraping: {channel_url}")
        print("-" * 50)

        data = scrape_channel(channel_url)

        print(f"\nName: {data['name']}")
        print(f"Handle: {data['handle']}")
        print(f"Avatar: {data['avatar_url']}")
        print(f"Subscribers: {data['subscriber_count']} ({data['followers_count']:,} followers)")
        print(f"Videos: {data['video_count']}")
        print(f"Views: {data['view_count']}")
        print(f"Location: {data['location']}")
        print(f"Joined: {data['joined_date']}")
        print(f"Email: {data['email']}")
        print(f"Description: {data['description'][:200]}..." if data['description'] else "Description: None")
        print(f"\nPlatforms: {', '.join(data['platforms'])}")
        print(f"Social Links:")
        for platform, url in data['social_links'].items():
            print(f"  - {platform}: {url}")

        print(f"\nLatest Videos:")
        for i, video in enumerate(data['videos'], 1):
            print(f"  {i}. {video['title']}")
            print(f"     URL: {video['video_url']}")
            print(f"     Duration: {video['duration']}, Views: {video['view_count']}, Published: {video['published_at']}")
            print(f"     Thumbnail: {video['thumbnail_url']}")

        print("\n" + "-" * 50)
        print("Platform Format:")
        platform_data = format_for_platform(data)
        print(json.dumps(platform_data, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
