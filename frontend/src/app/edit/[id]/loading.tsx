export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* Back button + title skeleton */}
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="h-8 w-48 bg-muted rounded" />
                </div>

                {/* Form card skeleton */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                    {/* Title field */}
                    <div className="space-y-2">
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="h-10 w-full bg-muted rounded" />
                    </div>

                    {/* Description field */}
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-32 w-full bg-muted rounded" />
                    </div>

                    {/* Category + Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-muted rounded" />
                            <div className="h-10 w-full bg-muted rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-12 bg-muted rounded" />
                            <div className="h-10 w-full bg-muted rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
