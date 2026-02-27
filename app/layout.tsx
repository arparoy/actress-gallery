import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Image & Video Gallery - Drop files in public/gallery and they appear automatically',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/1.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/1.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/1.jpg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/1.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
