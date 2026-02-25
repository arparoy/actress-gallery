import { NextResponse } from "next/server"

const OWNER = "arparoy"
const REPO = "actress-gallery"
const BRANCH = "main"
const GALLERY_PREFIX = "public/gallery/"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

export interface MediaItem {
  name: string
  displayName: string
  src: string
  type: "image" | "video"
}

// ---------------- In-memory cache ----------------
interface CacheEntry {
  data: MediaItem[]
  timestamp: number
}

let cache: CacheEntry | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ---------------- GitHub helpers ----------------
function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "actress-gallery-app",
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

interface GitTreeItem {
  path: string
  type: string
}

interface GitTreeResponse {
  tree: GitTreeItem[]
  truncated: boolean
}

/**
 * Fetch full repository tree (single API call)
 */
async function fetchMediaTree(): Promise<GitTreeItem[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
  const res = await fetch(url, { headers: githubHeaders() })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub API error: ${res.status} ${text}`)
  }

  const data: GitTreeResponse = await res.json()

  if (data.truncated) {
    throw new Error("GitHub tree truncated. Repository too large.")
  }

  return data.tree.filter((item) => {
    if (item.type !== "blob") return false
    if (!item.path.startsWith(GALLERY_PREFIX)) return false

    const ext = item.path.substring(item.path.lastIndexOf(".")).toLowerCase()
    return MEDIA_EXTENSIONS.includes(ext)
  })
}

/**
 * Build raw GitHub file URL
 */
function buildRawUrl(filePath: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`
}

/**
 * Determine media type
 */
function getMediaType(filePath: string): "image" | "video" {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext) ? "video" : "image"
}

// ---------------- Route Handler ----------------
export async function GET() {
  try {
    // Serve from cache if valid
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { "X-Cache": "HIT" },
      })
    }

    // Fetch media files
    const mediaFiles = await fetchMediaTree()

    if (mediaFiles.length === 0) {
      cache = { data: [], timestamp: Date.now() }
      return NextResponse.json([])
    }

    // Sort by filename (stable + fast)
    mediaFiles.sort((a, b) => b.path.localeCompare(a.path))

    // Build response
    const items: MediaItem[] = mediaFiles.map((file, index) => {
      const name = file.path.substring(file.path.lastIndexOf("/") + 1)
      const ext = name.substring(name.lastIndexOf(".")).toLowerCase()
      const paddedIndex = String(index + 1).padStart(3, "0")

      return {
        name,
        displayName: `actress-gallery${paddedIndex}${ext}`,
        src: buildRawUrl(file.path),
        type: getMediaType(file.path),
      }
    })

    // Update cache
    cache = { data: items, timestamp: Date.now() }

    return NextResponse.json(items, {
      headers: { "X-Cache": "MISS" },
    })
  } catch (error: any) {
    console.error("Media API error:", error?.message)

    return NextResponse.json(
      { error: error?.message || "Failed to fetch media" },
      { status: 500 }
    )
  }
}
