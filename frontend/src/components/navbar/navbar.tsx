'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { UserProfile } from '@/types'
import { getUserFromToken, removeToken, authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X, LayoutDashboard, Wallet, FileEdit, Users, LogOut, User as UserIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { RankBadgeWithPoints } from '@/components/ui/rank-badge'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setUser(getUserFromToken())
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    removeToken()
    setUser(null)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="fixed select-none top-0 left-0 w-full px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm border-b border-border/10 bg-background/10 backdrop-blur-lg z-500 transition-all duration-300">
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
          <Sheet>
            <SheetTrigger asChild>
              <button className="focus:outline-none flex items-center rounded-full hover:ring-2 hover:ring-primary/50 transition-all select-none">
                <Avatar className="relative w-9 h-9">
                  <Image
                    src={user?.photoURL || ''}
                    alt={user?.displayName || 'User'}
                    fill
                    className="rounded-full object-cover"
                    sizes="36px"
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
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] z-[600] sm:w-[350px]">
              <SheetHeader className="text-left mt-4 border-b border-border/50 pb-4 mb-4">
                <SheetTitle className="text-lg">My Profile</SheetTitle>
                <div className="flex items-center gap-3 mt-4">
                  <Avatar className="w-12 h-12">
                    <Image
                      src={user?.photoURL || ''}
                      alt={user?.displayName || 'User'}
                      fill
                      className="rounded-full object-cover"
                      sizes="48px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <AvatarFallback className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600 text-lg font-medium">
                      {user?.displayName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base truncate pr-2 max-w-[180px]">{user?.displayName || 'User'}</span>
                    <div className="mt-1 scale-90 origin-left">
                      <RankBadgeWithPoints rank={user.rank || 'F'} points={user.points || 0} />
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-1.5 h-[calc(100vh-180px)] overflow-y-auto pr-2">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <UserIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Solving Dashboard</span>
                </Link>
                <Link href="/earnings" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Earnings</span>
                </Link>
                <Link href="/drafts" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <FileEdit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Drafts</span>
                </Link>
                <Link href="/connections" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Connections</span>
                </Link>

                <div className="h-px bg-border/50 my-2" />

                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors group w-full text-left">
                  <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
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
          <Sheet>
            <SheetTrigger asChild>
              <button className="focus:outline-none flex items-center rounded-full hover:ring-2 hover:ring-primary/50 transition-all mr-2 select-none">
                <Avatar className="relative w-8 h-8">
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
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="text-left mt-4 border-b border-border/50 pb-4 mb-4">
                <SheetTitle className="text-lg">My Profile</SheetTitle>
                <div className="flex items-center gap-3 mt-4">
                  <Avatar className="w-12 h-12">
                    <Image
                      src={user?.photoURL || ''}
                      alt={user?.displayName || 'User'}
                      fill
                      className="rounded-full object-cover"
                      sizes="48px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <AvatarFallback className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600 text-lg font-medium">
                      {user?.displayName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base truncate pr-2 max-w-[180px]">{user?.displayName || 'User'}</span>
                    <div className="mt-1 scale-90 origin-left">
                      <RankBadgeWithPoints rank={user.rank || 'F'} points={user.points || 0} />
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-1.5 h-[calc(100vh-180px)] overflow-y-auto pr-2">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <UserIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Solving Dashboard</span>
                </Link>
                <Link href="/earnings" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Earnings</span>
                </Link>
                <Link href="/drafts" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <FileEdit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Drafts</span>
                </Link>
                <Link href="/connections" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors group">
                  <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Connections</span>
                </Link>

                <div className="h-px bg-border/50 my-2" />

                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors group w-full text-left">
                  <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
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