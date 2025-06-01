'use client'

import { Suspense } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ClientOnlyChat from '../components/ClientOnlyChat'

export default function ChatPage() {
  return (
    <main className="min-h-screen">
       {/* <div className="bg-pink-500 text-white p-8 text-2xl">
        🎀 Tailwind Test - This should be PINK!
      </div> */}

      <Suspense fallback={<LoadingSpinner />}>
        <ClientOnlyChat />
      </Suspense>
    </main>
  )
}