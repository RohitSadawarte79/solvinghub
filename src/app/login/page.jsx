'use client'

import { signInWithGoogle } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/') // Redirect if already logged in
      }
    }
    checkUser()
  }, [router])

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      // Redirect happens automatically via callback
    } catch (error) {
      console.error("Authentication failed:", error)
    }
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
