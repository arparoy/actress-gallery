import { NextResponse } from "next/server"

const OWNER = "arparoy"
const REPO = "actress-gallery"
const BRANCH = "main"
const GALLERY_PATH = "public/gallery"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

export interface MediaItem {
  name: string
  displayName: string
  src: string
  type: "image" | "video"
}

function githubHeaders(): HeadersInit {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not defined in environment variables")
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

interface GitHubContentItem {
  name: string
  path: string
  type: string
  download_url: string
}

function getMediaType(filename: string): "image" | "video" {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext) ? "video" : "image"
}

export async function GET() {
  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${GALLERY_PATH}?ref=${BRANCH}`

    const response = await fetch(url, {
      headers: githubHeaders(),
      // Important: allow Vercel edge caching
      next: { revalidate: 600 }, // 10 minutes ISR
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`GitHub API error ${response.status}: ${text}`)
    }

    const files: GitHubContentItem[] = await response.json()

    const mediaFiles = files
      .filter((file) => {
        if (file.type !== "file") return false
        const ext = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase()
        return MEDIA_EXTENSIONS.includes(ext)
      })
      .sort((a, b) => b.name.localeCompare(a.name))

    const items: MediaItem[] = mediaFiles.map((file, index) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      const paddedIndex = String(index + 1).padStart(3, "0")

      return {
        name: file.name,
        displayName: `actress-gallery${paddedIndex}${ext}`,
        src: file.download_url,
        type: getMediaType(file.name),
      }
    })

    return NextResponse.json(items, {
      headers: {
        "Cache-Control":
          "public, s-maxage=600, stale-while-revalidate=3600",
      },
    })
  } catch (error: any) {
    console.error("Media API error:", error?.message)

    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    )
  }
}
