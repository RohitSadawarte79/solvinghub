'use client';

import dynamic from 'next/dynamic';

const MyProblems = dynamic(
    () => import('@/components/submitted-problems/myProblems'),
    { ssr: false }
);

export default function MyProblemsClient() {
    return <MyProblems />;
}
