"use client"

import { ImageIcon, Film, LayoutGrid } from "lucide-react"

type FilterType = "all" | "image" | "video"

interface GalleryHeaderProps {
  totalCount: number
  imageCount: number
  videoCount: number
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function GalleryHeader({
  totalCount,
  imageCount,
  videoCount,
  activeFilter,
  onFilterChange,
}: GalleryHeaderProps) {
  const filters: { key: FilterType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all", label: "All", icon: <LayoutGrid className="h-4 w-4" />, count: totalCount },
    { key: "image", label: "Photos", icon: <ImageIcon className="h-4 w-4" />, count: imageCount },
    { key: "video", label: "Videos", icon: <Film className="h-4 w-4" />, count: videoCount },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <LayoutGrid className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              Gallery
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.icon}
              <span className="hidden sm:inline">{filter.label}</span>
              <span
                className={`ml-0.5 text-xs ${
                  activeFilter === filter.key ? "text-background/70" : "text-muted-foreground/70"
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
