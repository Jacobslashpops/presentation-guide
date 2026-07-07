#!/usr/bin/env python3
"""
Insert scraped YouTube videos into CelePulse database.
Usage:
    python insert_videos.py <channel_url>
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from youtube_scraper import scrape_channel
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')


def get_influencer_id_by_name(supabase, display_name):
    """Find influencer by display name."""
    result = supabase.table('influencers').select('id').eq('display_name', display_name).execute()
    if result.data:
        return result.data[0]['id']
    return None


def insert_videos(supabase, influencer_id, videos):
    """Insert videos into database."""
    for video in videos:
        video_data = {
            'influencer_id': influencer_id,
            'video_id': video['video_id'],
            'title': video['title'],
            'description': video.get('description'),
            'thumbnail_url': video.get('thumbnail_url'),
            'duration': video.get('duration'),
            'view_count': video.get('view_count'),
            'published_at': video.get('published_at'),
            'video_url': video.get('video_url'),
        }

        # Upsert to avoid duplicates
        supabase.table('videos').upsert(
            video_data,
            on_conflict='influencer_id,video_id'
        ).execute()

    print(f"Inserted/updated {len(videos)} videos")


def main():
    if len(sys.argv) < 2:
        print("Usage: python insert_videos.py <youtube_channel_url>")
        sys.exit(1)

    channel_url = sys.argv[1]

    # Initialize Supabase
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in environment")
        sys.exit(1)

    supabase = create_client(supabase_url, supabase_key)

    # Scrape channel data
    print(f"Scraping: {channel_url}")
    data = scrape_channel(channel_url)

    # Find influencer in database
    influencer_id = get_influencer_id_by_name(supabase, data['name'])
    if not influencer_id:
        print(f"Influencer '{data['name']}' not found in database. Please insert channel first.")
        sys.exit(1)

    print(f"Found influencer ID: {influencer_id}")

    # Insert videos
    if data['videos']:
        insert_videos(supabase, influencer_id, data['videos'])
    else:
        print("No videos found")


if __name__ == '__main__':
    main()
