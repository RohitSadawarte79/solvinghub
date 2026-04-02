"use client"; // For Next.js client components

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/toast-wrapper';
import { api, getUserFromToken } from '@/lib/api';
import type { Problem } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProblemForm from '@/components/problems/ProblemForm';

export default function PostProblem() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSubmit = async (formData: Partial<Problem>) => {
    const user = getUserFromToken();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a problem.",
        variant: "destructive"
      });
      router.push('/login?redirect=/problems/post');
      return;
    }

    setIsSubmitting(true);

    try {
      // Add document to Go API
      await api.post("/problems", formData);

      toast({
        title: "Problem Submitted",
        description: "Your problem has been successfully posted. Thank you for your contribution!"
      });

      // Reset changes flag so standard navigation works
      setHasChanges(false);

      // Give state time to update before redirect
      setTimeout(() => {
        router.push('/my-problems');
      }, 100);

    } catch (error) {
      console.error("Error submitting problem:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred while submitting your problem. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/discover">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={(e) => {
              if (hasChanges) {
                e.preventDefault();
                document.getElementById('confirm-navigation-dialog')?.click();
              }
            }}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Problems
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Post a Problem</h1>
          <p className="text-muted-foreground">
            Share a real-world problem that you&apos;d like the community to help solve.
          </p>
        </div>
      </div>

      {/* Confirm navigation dialog */}
      <AlertDialog>
        <AlertDialogTrigger id="confirm-navigation-dialog" className="hidden">Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave this page, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on this page</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/discover')}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProblemForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Submit Problem"
        onHasChanges={setHasChanges}
      />
    </div>
  );
}