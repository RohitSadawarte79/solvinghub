"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getUserFromToken, api, solutionsApi, rankApi } from '@/lib/api';
import { RANK_LABELS } from '@/lib/constants';
import { toast } from "@/lib/toast-wrapper";
import type { Problem, Solution, Rank } from '@/types';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';

const SolutionForm = dynamic(
    () => import("@/components/solutions/SolutionForm"),
    { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> }
);

export default function SubmitSolutionPage() {
    const params = useParams();
    const router = useRouter();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canSubmit, setCanSubmit] = useState(true);
    const [cannotSubmitReason, setCannotSubmitReason] = useState<string>('');
    const [userRank, setUserRank] = useState<Rank>('F');
    const [userPoints, setUserPoints] = useState<number>(0);

    const problemId = params?.id;
    const currentUser = getUserFromToken();

    useEffect(() => {
        const fetchProblem = async () => {
            if (!problemId) return;

            setLoading(true);
            setError(null);

            try {
                const problemData = await api.get<Problem>(`/problems/${problemId}`);
                setProblem(problemData as Problem);
            } catch (error) {
                console.error("Error fetching problem:", error);
                setError("Failed to load problem details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProblem();
    }, [problemId]);

    // Check if user can submit using backend API
    useEffect(() => {
        const checkAccess = async () => {
            if (!problemId || !currentUser) {
                setCanSubmit(true);
                return;
            }

            try {
                // Get user's rank from backend
                try {
                    const rankProfile = await rankApi.getMyRank();
                    setUserRank(rankProfile.currentRank);
                    setUserPoints(rankProfile.points);
                } catch {
                    // User might not have a rank profile yet, default to F
                    setUserRank('F');
                    setUserPoints(0);
                }

                // Check if user can submit to this problem
                const accessCheck = await solutionsApi.checkCanSolve(problemId as string);
                setCanSubmit(accessCheck.canSubmit);
                setCannotSubmitReason(accessCheck.reason);
            } catch (err) {
                console.error('Error checking solution access:', err);
                // On error, allow access (fail open)
                setCanSubmit(true);
            }
        };

        checkAccess();
    }, [problemId, currentUser]);

    const handleSubmitSolution = async (formData: Partial<Solution>) => {
        if (!currentUser) {
            toast({
                title: "Authentication Required",
                description: "Please log in to submit a solution.",
                variant: "destructive"
            });
            router.push(`/login?redirect=/problems/${problemId}/submit-solution`);
            return;
        }

        setIsSubmitting(true);

        try {
            await solutionsApi.submit(problemId as string, {
                ...formData,
                problemId: problemId as string,
            });

            toast({
                title: "Solution Submitted!",
                description: "Your solution has been submitted. The problem owner will review it."
            });

            // Redirect to problem page
            router.push(`/problems/${problemId}`);
        } catch (error) {
            console.error("Error submitting solution:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to submit solution. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push(`/problems/${problemId}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
                <div className="flex justify-center items-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                        <p className="text-lg font-medium">{error}</p>
                        <Button onClick={() => router.push('/discover')} className="mt-4">
                            Browse Problems
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!problem) {
        return null;
    }

    // Show rank restriction if user can't access this difficulty
    if (!canSubmit && currentUser) {
        return (
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Problem
                </Button>

                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Lock className="h-12 w-12 text-amber-600 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Rank Required</h2>
                        <p className="text-center text-muted-foreground max-w-md mb-6">
                            {cannotSubmitReason || `This problem requires a higher rank to submit solutions.`}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Current Rank: <strong>{userRank} ({RANK_LABELS[userRank] || 'Novice'})</strong>
                            {userPoints > 0 && <span className="ml-2">• {userPoints} points</span>}
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={() => router.push('/discover')} variant="outline">
                                Browse Problems
                            </Button>
                            <Button onClick={() => router.back()}>
                                View Problem
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Problem
            </Button>

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Submit Your Solution</h1>
                <p className="text-muted-foreground mt-2">
                    Propose your solution to help solve this problem.
                </p>
            </div>

            <SolutionForm
                problem={problem}
                onSubmit={handleSubmitSolution}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitLabel="Submit Solution"
            />
        </div>
    );
}