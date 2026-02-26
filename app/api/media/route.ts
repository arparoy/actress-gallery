import { NextResponse } from "next/server"

const OWNER = "arparoy"
const REPO = "actress-gallery"
const BRANCH = "main"
const GALLERY_PREFIX = "public/gallery/"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heif"]
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

export interface MediaItem {
  name: string
  displayName: string
  src: string
  type: "image" | "video"
  committedAt: string
}

// --------------- In-memory cache ---------------
interface CacheEntry {
  data: MediaItem[]
  timestamp: number
}

let cache: CacheEntry | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// --------------- GitHub API helpers ---------------
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
  mode: string
  type: string
  sha: string
  size?: number
  url: string
}

interface GitTreeResponse {
  sha: string
  url: string
  tree: GitTreeItem[]
  truncated: boolean
}

interface GitCommit {
  sha: string
  commit: {
    committer: {
      date: string
    }
  }
}

/**
 * Fetch the full repo tree in a single API call (recursive).
 * Returns only media files under public/gallery/.
 */
async function fetchMediaTree(): Promise<GitTreeItem[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
  const res = await fetch(url, { headers: githubHeaders() })

  if (!res.ok) {
    throw new Error(`GitHub Trees API error: ${res.status} ${res.statusText}`)
  }

  const data: GitTreeResponse = await res.json()

  return data.tree.filter((item) => {
    if (item.type !== "blob") return false
    if (!item.path.startsWith(GALLERY_PREFIX)) return false
    const ext = item.path.substring(item.path.lastIndexOf(".")).toLowerCase()
    return MEDIA_EXTENSIONS.includes(ext)
  })
}

/**
 * Fetch the last commit date for a file.
 * Uses per_page=1 to get only the most recent commit.
 */
async function fetchCommitDate(filePath: string): Promise<string> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/commits?path=${encodeURIComponent(filePath)}&sha=${BRANCH}&per_page=1`
  const res = await fetch(url, { headers: githubHeaders() })

  if (!res.ok) {
    // Fallback to epoch if we can't get the date
    return new Date(0).toISOString()
  }

  const commits: GitCommit[] = await res.json()
  if (commits.length === 0) {
    return new Date(0).toISOString()
  }

  return commits[0].commit.committer.date
}

/**
 * Fetch commit dates for all files, with concurrency limiting.
 */
async function fetchAllCommitDates(
  files: GitTreeItem[]
): Promise<Map<string, string>> {
  const dateMap = new Map<string, string>()
  const CONCURRENCY = 10

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (file) => {
        const date = await fetchCommitDate(file.path)
        return { path: file.path, date }
      })
    )
    for (const r of results) {
      dateMap.set(r.path, r.date)
    }
  }

  return dateMap
}

/**
 * Build the raw.githubusercontent.com URL for a file.
 */
function buildRawUrl(filePath: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`
}

/**
 * Determine media type from file extension.
 */
function getMediaType(filePath: string): "image" | "video" {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext) ? "video" : "image"
}

// --------------- Route Handler ---------------
export async function GET() {
  try {
    // Return cached data if still fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { "X-Cache": "HIT" },
      })
    }

    // 1. Fetch the full file tree from GitHub
    const mediaFiles = await fetchMediaTree()

    if (mediaFiles.length === 0) {
      cache = { data: [], timestamp: Date.now() }
      return NextResponse.json([])
    }

    // 2. Fetch commit dates for all files (for newest-first sorting)
    const commitDates = await fetchAllCommitDates(mediaFiles)

    // 3. Build MediaItem array
    const items: MediaItem[] = mediaFiles.map((file) => {
      const name = file.path.substring(file.path.lastIndexOf("/") + 1)
      const type = getMediaType(file.path)
      const committedAt = commitDates.get(file.path) || new Date(0).toISOString()

      return {
        name,
        displayName: name,
        src: buildRawUrl(file.path),
        type,
        committedAt,
      }
    })

    // 4. Sort by commit date descending (newest first)
    items.sort(
      (a, b) =>
        new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime()
    )

    // 5. Assign sequential display names after sorting
    const itemsWithDisplayNames = items.map((item, index) => {
      const ext = item.name.substring(item.name.lastIndexOf(".")).toLowerCase()
      const paddedIndex = String(index + 1).padStart(2, "0")
      return {
        ...item,
        displayName: `actress-gallery${paddedIndex}${ext}`,
      }
    })

    // 6. Update cache
    cache = { data: itemsWithDisplayNames, timestamp: Date.now() }

    return NextResponse.json(itemsWithDisplayNames, {
      headers: { "X-Cache": "MISS" },
    })
  } catch (error) {
    console.error("Failed to fetch media from GitHub:", error)
    return NextResponse.json(
      { error: "Failed to fetch media from GitHub" },
      { status: 500 }
    )
  }
}
