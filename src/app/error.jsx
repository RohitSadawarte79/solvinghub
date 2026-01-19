'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Global Error Boundary
 * Catches React errors and prevents full app crash
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({ error, reset }) {
    useEffect(() => {
        // Log error to monitoring service (e.g., Sentry)
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                {/* Error Message */}
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Something went wrong!
                </h2>
                <p className="text-slate-600 mb-6">
                    We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm font-mono text-slate-700 break-words">
                            {error.message || 'Unknown error'}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-slate-500 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                    <Link href="/">
                        <Button variant="outline" className="flex items-center gap-2 w-full">
                            <Home className="w-4 h-4" />
                            Go Home
                        </Button>
                    </Link>
                </div>

                {/* Help Link */}
                <p className="text-sm text-slate-500 mt-6">
                    If the problem persists,{' '}
                    <a href="mailto:support@solvinghub.com" className="text-blue-600 hover:underline">
                        contact support
                    </a>
                </p>
            </div>
        </div>
    )
}
