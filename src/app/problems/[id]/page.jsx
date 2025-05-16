// app/problems/[id]/page.jsx
"use client"

import { useParams } from 'next/navigation';
import ProblemDetailComponent from '@/components/problem details/problem-detail-component';

export default function ProblemPage() {
  const params = useParams();
  
  return <ProblemDetailComponent params={params} />;
}