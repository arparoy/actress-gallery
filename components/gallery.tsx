"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { GalleryHeader } from "./gallery-header"
import { GalleryGrid } from "./gallery-grid"
import { Lightbox } from "./lightbox"
import type { MediaItem } from "@/app/api/media/route"

type FilterType = "all" | "image" | "video"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Gallery() {
  const { data: items = [], isLoading } = useSWR<MediaItem[]>("/api/media", fetcher, {
    revalidateOnFocus: false,
  })

  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const imageCount = useMemo(() => items.filter((i) => i.type === "image").length, [items])
  const videoCount = useMemo(() => items.filter((i) => i.type === "video").length, [items])

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items
    return items.filter((i) => i.type === activeFilter)
  }, [items, activeFilter])

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  return (
    <div className="min-h-screen bg-background">
      <GalleryHeader
        totalCount={items.length}
        imageCount={imageCount}
        videoCount={videoCount}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <main className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8">
        {isLoading ? (
          <div className="columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {[240, 300, 200, 260, 220, 280, 310, 190, 250, 270, 230, 290].map((h, i) => (
              <div
                key={i}
                className="mb-3 break-inside-avoid animate-pulse rounded-lg bg-secondary"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        ) : (
          <GalleryGrid items={filteredItems} onItemClick={openLightbox} />
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          items={filteredItems}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
