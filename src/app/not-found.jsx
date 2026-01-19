'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

/**
 * 404 Not Found Page
 * Shown when user navigates to a non-existent route
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* 404 Icon */}
                <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <FileQuestion className="w-10 h-10 text-slate-400" />
                </div>

                {/* 404 Message */}
                <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">
                    Page Not Found
                </h2>
                <p className="text-slate-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="flex items-center gap-2 w-full">
                            <Home className="w-4 h-4" />
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-4">Popular pages:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Link
                            href="/discover"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Explore Problems
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link
                            href="/post"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Post a Problem
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link
                            href="/login"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
