import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6">
                <h1 className="text-8xl font-bold text-muted-foreground/30">404</h1>
                <h2 className="text-2xl font-semibold">Page Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back on track.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <Link
                        href="/home"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6 hover:bg-primary/90 transition-colors"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/discover"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-10 px-6 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Discover Problems
                    </Link>
                </div>
            </div>
        </div>
    );
}
