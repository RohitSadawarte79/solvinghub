/**
 * Global Loading State
 * Shown during page transitions and data fetches
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
                {/* Animated Spinner */}
                <div className="relative w-16 h-16 mx-auto mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
                </div>

                {/* Loading Text */}
                <p className="text-slate-600 font-medium">Loading...</p>
                <p className="text-sm text-slate-400 mt-1">Please wait a moment</p>
            </div>
        </div>
    )
}
