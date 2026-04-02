"use client"; // For Next.js client components

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast-wrapper';
import { api, getUserFromToken } from '@/lib/api';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

import ProblemForm from '@/components/problems/ProblemForm';

interface EditProblemProps {
  params: Promise<{ id: string }>;
}

export default function EditProblem({ params }: EditProblemProps) {
  const router = useRouter();

  // Use React.use() to unwrap the params promise as required in Next.js 15
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;

  const [problemData, setProblemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProblem = async () => {
    setIsLoading(true);

    try {
      const user = getUserFromToken();

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to edit problems.",
          variant: "destructive"
        });
        router.push('/login?redirect=/my-problems');
        return;
      }

      // 2. Fetch the document
      const data = await api.get<any>(`/problems/${id}`);

      // 3. Verify authorization
      // Note: we use submittedById to verify ownership robustly instead of displayName
      if (data.submittedById && data.submittedById !== user.uid) {
        toast({
          title: "Not Authorized",
          description: "You can only edit problems that you submitted.",
          variant: "destructive"
        });
        router.push('/my-problems');
        return;
      }

      // 4. Set state to populate form
      setProblemData(data);

    } catch (error: any) {
      if (error.message && error.message.includes("404")) {
        toast({
          title: "Problem Not Found",
          description: "The problem you're trying to edit doesn't exist.",
          variant: "destructive"
        });
        router.push('/my-problems');
        return;
      }
      console.error("Error fetching problem:", error);
      toast({
        title: "Error Loading Data",
        description: "An error occurred while loading the problem details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);

    try {
      await api.put(`/problems/${id}`, formData);

      toast({
        title: "Problem Updated",
        description: "Your problem has been successfully updated."
      });

      router.push('/my-problems');
    } catch (error) {
      console.error("Error updating problem:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your problem. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 mb-8 bg-muted rounded animate-pulse" />
        <Card>
          <CardHeader>
            <div className="h-8 w-64 mb-2 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If loading finished but no data found, return empty
  if (!problemData) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => {
            if (hasChanges && !window.confirm("You have unsaved changes. Discard them?")) {
              return;
            }
            router.push('/my-problems');
          }}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to My Problems
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Problem</h1>
          <p className="text-muted-foreground">
            Update the details of your submitted problem.
          </p>
        </div>
      </div>

      <ProblemForm
        initialData={problemData}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (!hasChanges || window.confirm("You have unsaved changes. Discard them?")) {
            router.push('/my-problems');
          }
        }}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
        onHasChanges={setHasChanges}
      />
    </div>
  );
}