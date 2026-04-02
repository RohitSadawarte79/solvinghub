'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-semibold">Something went wrong</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    An unexpected error occurred. Please try again or go back to the home page.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6 hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                    <a
                        href="/home"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-10 px-6 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
