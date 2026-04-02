export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="h-8 w-48 bg-muted rounded" />
                </div>

                {/* Title skeleton */}
                <div className="h-10 w-3/4 bg-muted rounded" />

                {/* Metadata skeleton */}
                <div className="flex gap-4">
                    <div className="h-6 w-24 bg-muted rounded-full" />
                    <div className="h-6 w-32 bg-muted rounded-full" />
                    <div className="h-6 w-20 bg-muted rounded-full" />
                </div>

                {/* Content skeleton */}
                <div className="space-y-3">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                    <div className="h-4 w-4/6 bg-muted rounded" />
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
