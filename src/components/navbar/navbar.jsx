'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <nav className="fixed w-full px-6 py-4 flex justify-between items-center shadow-sm border-b bg-white">
      {/* Left: Logo + Navigation Links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-black font">
          SolvingHub
        </Link>
        <Link href="/discover" className="text-sm text-muted-foreground hover:text-black">
          Explore
        </Link>
        <Link href="/post" className="text-sm text-muted-foreground hover:text-black">
          Post
        </Link>
        <Link href="/my-problems" className="text-sm text-muted-foreground hover:text-black">
          My Problems
        </Link>
        {/* <Link href="./navbar components/categories" className="text-sm text-muted-foreground hover:text-black">
          Categories
        </Link> */}
      </div>

      {/* Right: User Login / Avatar */}
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
            <Link href="/login">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
