'use client'

export function ChannelBanner({ url }: { url: string | null }) {
  return (
    <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
      {url && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      {/* Bottom white gradient for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  )
}
