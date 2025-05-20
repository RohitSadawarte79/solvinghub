"use client"; // For Next.js client components

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Other imports remain the same...

// Create a separate component that uses useSearchParams
function DiscoverProblemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);
  // Rest of your state and logic...
  
  // The rest of your component implementation...
  
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Your existing JSX */}
    </div>
  );
}

// Fallback component to show while loading
function DiscoverProblemsFallback() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function DiscoverProblems() {
  return (
    <Suspense fallback={<DiscoverProblemsFallback />}>
      <DiscoverProblemsContent />
    </Suspense>
  );
}
