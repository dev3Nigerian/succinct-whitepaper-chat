import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Succinct Network Whitepaper Chat ✨',
  description: 'Interactive chat interface for querying the Succinct Network whitepaper with a beautiful pink theme',
  keywords: ['Succinct Network', 'Zero Knowledge', 'Proof Contests', 'SP1', 'zkVM', 'Pink Theme'],
  authors: [{ name: 'Succinct Network Team' }],
}

// Fix for viewport warning - separate viewport export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
          {children}
        </div>
      </body>
    </html>
  )
}