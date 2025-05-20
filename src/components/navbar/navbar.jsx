'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="fixed top-0 left-0 w-full px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm border-b bg-white z-50">
      {/* Left: Logo + Navigation Links (Desktop) */}
      <div className="flex items-center gap-3 sm:gap-6">
        <Link href="/" className="text-xl font-bold text-black">
          SolvingHub
        </Link>
        <div className="hidden md:flex items-center gap-4 sm:gap-6">
          <Link href="/discover" className="text-sm text-muted-foreground hover:text-black">
            Explore
          </Link>
          <Link href="/post" className="text-sm text-muted-foreground hover:text-black">
            Post
          </Link>
          <Link href="/my-problems" className="text-sm text-muted-foreground hover:text-black">
            My Problems
          </Link>
        </div>
      </div>

      {/* Right: User Login / Avatar (Desktop) */}
      <div className="hidden md:block">
        {user ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <Button style={{ cursor: 'pointer' }} variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button style={{ cursor: 'pointer' }} variant="outline">Login</Button>
          </Link>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        {user && (
          <Avatar className="mr-4">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        )}
        <button 
          onClick={toggleMobileMenu} 
          className="text-slate-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md py-4 px-6 z-50 md:hidden border-b border-slate-200">
          <div className="flex flex-col gap-4">
            <Link 
              href="/discover" 
              className="text-sm text-muted-foreground hover:text-black py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link 
              href="/post" 
              className="text-sm text-muted-foreground hover:text-black py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Post
            </Link>
            <Link 
              href="/my-problems" 
              className="text-sm text-muted-foreground hover:text-black py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Problems
            </Link>
            <div className="pt-2 border-t border-slate-200">
              {user ? (
                <Button 
                  style={{ cursor: 'pointer' }} 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  Logout
                </Button>
              ) : (
                <Link href="/login" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button style={{ cursor: 'pointer' }} variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}