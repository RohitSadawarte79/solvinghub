'use client'

import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Globe } from '@/components/ui/globe' // 👈 Your globe component
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        router.push('/dashboard') // ✅ Redirect if already logged in
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleLogin = async () => {
    await signInWithPopup(auth, provider)
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Globe Background */}
      <Globe />

      {/* Login Overlay */}
      <div className="absolute z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/70 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">Welcome to SolvingHub</h1>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-300">Sign in to start solving real-world problems</p>
        <Button onClick={handleLogin}>Sign in with Google</Button>
      </div>
    </div>
  )
}
