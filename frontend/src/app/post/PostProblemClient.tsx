'use client';

import dynamic from 'next/dynamic';

const PostProblem = dynamic(
    () => import("@/components/posting/PostProblem"),
    { ssr: false }
);

export default function PostProblemClient() {
    return <PostProblem />;
}
