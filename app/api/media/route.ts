import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const MEDIA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".mp4", ".webp", ".gif", ".webm", ".mov"]
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]

export interface MediaItem {
  name: string
  src: string
  type: "image" | "video"
}

function scanDirectory(dirPath: string, basePath: string): MediaItem[] {
  const items: MediaItem[] = []

  if (!fs.existsSync(dirPath)) {
    return items
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      items.push(...scanDirectory(fullPath, basePath))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (MEDIA_EXTENSIONS.includes(ext)) {
        const relativePath = "/" + path.relative(basePath, fullPath).replace(/\\/g, "/")
        const type = IMAGE_EXTENSIONS.includes(ext) ? "image" : VIDEO_EXTENSIONS.includes(ext) ? "video" : null

        if (type) {
          items.push({
            name: entry.name,
            src: relativePath,
            type,
          })
        }
      }
    }
  }

  return items
}

export async function GET() {
  const publicDir = path.join(process.cwd(), "public", "gallery")
  const items = scanDirectory(publicDir, path.join(process.cwd(), "public"))

  // Sort by name
  items.sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json(items)
}
