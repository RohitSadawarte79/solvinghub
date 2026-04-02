import React, { Suspense } from 'react';
import DiscoverProblems from '@/components/problems/DiscoverProblems';

export const metadata = {
  title: 'Discover Problems — SolvingHub',
  description: 'Browse, search, and filter real-world problems submitted by the community. Find problems you care about and join the discussion.',
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverProblems />
    </Suspense>
  );
}