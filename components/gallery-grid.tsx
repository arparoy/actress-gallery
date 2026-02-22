"use client"

import { Play } from "lucide-react"
import type { MediaItem } from "@/app/api/media/route"

interface GalleryGridProps {
  items: MediaItem[]
  onItemClick: (index: number) => void
}

export function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">No media found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {"Add your images (.jpg, .png) and videos (.mp4) to the "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-foreground">
            public/gallery
          </code>
          {" folder and they'll appear here automatically."}
        </p>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
      {items.map((item, index) => (
        <button
          key={item.src}
          onClick={() => onItemClick(index)}
          className="group relative mb-3 block w-full overflow-hidden rounded-lg break-inside-avoid bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {item.type === "image" ? (
            <img
              src={item.src}
              alt={item.name}
              loading="lazy"
              className="block w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative">
              <video
                src={item.src}
                muted
                playsInline
                preload="metadata"
                className="block w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onMouseEnter={(e) => {
                  const video = e.currentTarget
                  video.currentTime = 0
                  video.play().catch(() => {})
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors duration-300 group-hover:bg-background/10" />

          {/* File name tooltip */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-background/80 px-3 py-2 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
            <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
