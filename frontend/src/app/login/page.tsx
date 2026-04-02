'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getUserFromToken } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // If the user already has a valid token, redirect to home
    if (getUserFromToken()) {
      router.push('/')
    }
  }, [router])

  const handleLogin = () => {
    // Redirect to the Go backend's Google OAuth endpoint
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    window.location.href = `${API_BASE}/auth/google`;
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Globe Background - Implement your globe here if needed */}

      {/* Login Overlay */}
      <div className="absolute z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/70 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">Welcome to SolvingHub</h1>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-300">Sign in to start solving real-world problems</p>
        <Button onClick={handleLogin}>Sign in with Google</Button>
      </div>
    </div>
  )
}
