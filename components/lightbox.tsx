"use client"

import { useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { MediaItem } from "@/app/api/media/route"

interface LightboxProps {
  items: MediaItem[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ items, currentIndex, onClose, onNavigate }: LightboxProps) {
  const item = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose, handlePrev, handleNext])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Media viewer">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={onClose} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{item.name}</span>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={item.src}
            download={item.name}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Download file"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-foreground backdrop-blur-sm transition-all hover:bg-secondary md:left-4"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-foreground backdrop-blur-sm transition-all hover:bg-secondary md:right-4"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Media content */}
      <div className="relative z-[5] flex max-h-[85vh] max-w-[90vw] items-center justify-center">
        {item.type === "image" ? (
          <img
            key={item.src}
            src={item.src}
            alt={item.name}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <video
            key={item.src}
            src={item.src}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>
  )
}
