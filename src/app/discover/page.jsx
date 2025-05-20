import React, { Suspense } from 'react';
import DiscoverProblems from '@/components/problems/DiscoverProblems';

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverProblems />
    </Suspense>
  );
}