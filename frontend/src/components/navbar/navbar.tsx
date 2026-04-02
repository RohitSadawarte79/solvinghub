'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { UserProfile } from '@/types'
import { getUserFromToken, removeToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { RankBadgeWithPoints } from '@/components/ui/rank-badge'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setUser(getUserFromToken())
  }, [])

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="fixed top-0 left-0 w-full px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm border-b border-border/50 bg-background/80 backdrop-blur-lg z-50 transition-all duration-300">
      {/* Left: Logo + Navigation Links (Desktop) */}
      <div className="flex items-center gap-3 sm:gap-6">
        <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent transition-all duration-300 hover:opacity-80">
          SolvingHub
        </Link>
        <div className="hidden md:flex items-center gap-4 sm:gap-6">
          <Link href="/discover" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
            Explore
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full"></span>
          </Link>
          <Link href="/post" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
            Post
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full"></span>
          </Link>
          <Link href="/my-problems" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
            My Problems
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full"></span>
          </Link>
        </div>
      </div>

      {/* Right: User Login / Avatar (Desktop) */}
      <div className="hidden md:flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="relative w-8 h-8">
                <Image
                  src={user?.photoURL || ''}
                  alt={user?.displayName || 'User'}
                  fill
                  className="rounded-full object-cover"
                  sizes="32px"
                  onError={(e) => {
                    // Fallback to avatar fallback on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <AvatarFallback className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                  {user?.displayName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                {user?.rank && user?.points !== undefined ? (
                  <RankBadgeWithPoints rank={user.rank} points={user.points} />
                ) : user?.rank ? (
                  <RankBadgeWithPoints rank={user.rank} points={0} />
                ) : null}
              </div>
            </div>
            <Button style={{ cursor: 'pointer' }} variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">Login</Button>
          </Link>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <Avatar className="relative w-8 h-8 mr-2">
            <Image
              src={user?.photoURL || ''}
              alt={user?.displayName || 'User'}
              fill
              className="rounded-full object-cover"
              sizes="32px"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <AvatarFallback className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
              {user?.displayName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        <button
          onClick={toggleMobileMenu}
          className="text-foreground focus:outline-none"
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
        <div className="absolute top-full left-0 w-full bg-background shadow-md py-4 px-6 z-50 md:hidden border-b border-border">
          <div className="flex flex-col gap-4">
            <Link
              href="/discover"
              className="text-sm text-muted-foreground hover:text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="/post"
              className="text-sm text-muted-foreground hover:text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Post
            </Link>
            <Link
              href="/my-problems"
              className="text-sm text-muted-foreground hover:text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Problems
            </Link>
            <div className="pt-2 border-t border-border">
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  Logout
                </Button>
              ) : (
                <Link href="/login" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full shadow-lg shadow-primary/20">
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