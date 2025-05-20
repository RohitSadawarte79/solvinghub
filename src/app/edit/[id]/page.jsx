"use client"; // For Next.js client components
import React from 'react';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Plus, 
  PlusCircle, 
  MinusCircle, 
  ChevronLeft, 
  AlertCircle,
  LoaderCircle
} from 'lucide-react';
import { toast } from "sonner";
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
// Firebase imports
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function EditProblem({ params }) {
  const { id: problemId } = React.use(params);
  const router = useRouter();
  const methods = useForm();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [impacts, setImpacts] = useState(['']);
  const [challenges, setChallenges] = useState(['']);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [activeView, setActiveView] = useState('edit'); // 'edit' or 'preview'
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Categories list - matches the categories in DiscoverProblems
  const categories = [
    "Education", "Technology", "Health", "Environment", 
    "Food & Agriculture", "Transportation", "Finance", "Social"
  ];

  // Helper functions to reduce complexity of fetchProblem
  const handleNotFound = () => {
    setNotFound(true);
    setIsLoading(false);
  };
  
  const handleNotAuthorized = () => {
    setNotAuthorized(true);
    setIsLoading(false);
  };
  
  const populateFormData = (problemData) => {
    setTitle(problemData.title || '');
    setDescription(problemData.description || '');
    setCategory(problemData.category || '');
    setTags(problemData.tags || []);
    setImpacts(problemData.impacts?.length ? problemData.impacts : ['']);
    setChallenges(problemData.challenges?.length ? problemData.challenges : ['']);
    
    // Store original data for comparison
    setOriginalData(problemData);
    setIsLoading(false);
  };
  
  const handleFetchError = (error) => {
    console.error("Error fetching problem:", error);
    toast({
      title: "Error",
      description: "Failed to load problem data. Please try again.",
      variant: "destructive"
    });
    setIsLoading(false);
  };
  
  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) {
        handleNotFound();
        return;
      }

      try {
        const problemRef = doc(db, "problems", problemId);
        const problemSnap = await getDoc(problemRef);
        
        if (!problemSnap.exists()) {
          handleNotFound();
          return;
        }
        
        const problemData = problemSnap.data();
        
        // Check if current user is the author of the problem
        if (!auth.currentUser) {
          handleNotAuthorized();
          return;
        }
        
        if (problemData.submittedBy !== auth.currentUser.displayName) {
          handleNotAuthorized();
          return;
        }
        
        populateFormData(problemData);
      } catch (error) {
        handleFetchError(error);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Track if user has made changes to form
  useEffect(() => {
    if (!originalData) return;
    
    const hasDataChanged = 
      title !== originalData.title ||
      description !== originalData.description ||
      category !== originalData.category ||
      JSON.stringify(tags) !== JSON.stringify(originalData.tags) ||
      impacts.length !== originalData.impacts.length ||
      challenges.length !== originalData.challenges.length ||
      impacts.some((impact, i) => originalData.impacts[i] !== impact) ||
      challenges.some((challenge, i) => originalData.challenges[i] !== challenge);
    
    setHasChanges(hasDataChanged);
  }, [title, description, category, tags, impacts, challenges, originalData]);

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmedInput = tagInput.trim();
    const isValid = trimmedInput !== '' && !tags.includes(trimmedInput) && tags.length < 5;
    
    if (isValid) {
      setTags([...tags, trimmedInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddImpact = () => {
    if (impacts.length < 5) {
      setImpacts([...impacts, '']);
    }
  };

  const handleRemoveImpact = (index) => {
    const newImpacts = [...impacts];
    newImpacts.splice(index, 1);
    setImpacts(newImpacts);
  };

  const handleImpactChange = (index, value) => {
    const newImpacts = [...impacts];
    newImpacts[index] = value;
    setImpacts(newImpacts);
  };

  const handleAddChallenge = () => {
    if (challenges.length < 5) {
      setChallenges([...challenges, '']);
    }
  };

  const handleRemoveChallenge = (index) => {
    const newChallenges = [...challenges];
    newChallenges.splice(index, 1);
    setChallenges(newChallenges);
  };

  const handleChallengeChange = (index, value) => {
    const newChallenges = [...challenges];
    newChallenges[index] = value;
    setChallenges(newChallenges);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length < 10) {
      newErrors.title = "Title should be at least 10 characters";
    }
    
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length < 50) {
      newErrors.description = "Description should be at least 50 characters";
    }
    
    if (!category) {
      newErrors.category = "Category is required";
    }
    
    if (tags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }
    
    const emptyImpacts = impacts.findIndex(impact => !impact.trim());
    if (emptyImpacts !== -1) {
      newErrors.impacts = `Impact #${emptyImpacts + 1} cannot be empty`;
    }
    
    const emptyChallenges = challenges.findIndex(challenge => !challenge.trim());
    if (emptyChallenges !== -1) {
      newErrors.challenges = `Challenge #${emptyChallenges + 1} cannot be empty`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      setActiveView('edit'); // Switch back to edit mode to fix errors
      return;
    }
    
    // Clear any previous validation errors
    setErrors({});
    
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update a problem.",
        variant: "destructive"
      });
      router.push(`/login?redirect=/problems/edit/${problemId}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare problem data for update
      const problemData = {
        title,
        description,
        category,
        tags,
        impacts: impacts.filter(impact => impact.trim() !== ''),
        challenges: challenges.filter(challenge => challenge.trim() !== ''),
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser.displayName || "Anonymous"
      };
      
      // Update document in Firestore
      const problemRef = doc(db, "problems", problemId);
      await updateDoc(problemRef, problemData);
      
      toast({
        title: "Problem Updated",
        description: "Your problem has been successfully updated!"
      });
      
      // Navigate back to problem detail or my problems
      router.push(`/problems/${problemId}`);
    } catch (error) {
      console.error("Error updating problem:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your problem. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleView = (view) => {
    if (view === 'preview') {
      validateForm(); // Run validation before preview
    }
    setActiveView(view);
  };

  const renderErrorMessage = (fieldName) => {
    return errors[fieldName] ? (
      <p className="text-sm text-red-500 mt-1 flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        {errors[fieldName]}
      </p>
    ) : null;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <LoaderCircle className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-xl">Loading problem data...</p>
      </div>
    );
  }
  
  // Not found state
  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Problem Not Found</h1>
        <p className="text-lg mb-6">The problem you're trying to edit doesn't exist.</p>
        <Link href="/my-problems">
          <Button style={{ cursor: 'pointer' }}>Go to My Problems</Button>
        </Link>
      </div>
    );
  }
  
  // Not authorized state
  if (notAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Not Authorized</h1>
        <p className="text-lg mb-6">You don't have permission to edit this problem.</p>
        <Link href="/discover">
          <Button style={{ cursor: 'pointer' }}>Back to Problems</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <FormProvider {...methods}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href={`/problems/${problemId}`}>
            <Button
              style={{ cursor: 'pointer' }} 
              variant="ghost"
              className="mr-4"
              onClick={(e) => {
                if (hasChanges) {
                  e.preventDefault();
                  document.getElementById('confirm-navigation-dialog').click();
                }
              }}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Problem
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Edit Problem</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Update the details of your problem.
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
              <AlertDialogAction onClick={() => router.push(`/problems/${problemId}`)}>
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Tabs value={activeView} onValueChange={toggleView} className="w-full mb-6">
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="mt-0">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
                    {category || "No Category Selected"}
                  </div>
                </div>
                <CardTitle className="mt-3">{title || "Untitled Problem"}</CardTitle>
                <CardDescription className="mt-2 whitespace-pre-wrap">
                  {description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No tags added</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Key Impacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {impacts.filter(impact => impact.trim()).length > 0 ? (
                          impacts
                            .filter(impact => impact.trim())
                            .map((impact, index) => (
                              <li key={index} className="text-sm text-slate-600 dark:text-slate-300">{impact}</li>
                            ))
                        ) : (
                          <li className="text-sm text-slate-500">No impacts specified</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {challenges.filter(challenge => challenge.trim()).length > 0 ? (
                          challenges
                            .filter(challenge => challenge.trim())
                            .map((challenge, index) => (
                              <li key={index} className="text-sm text-slate-600 dark:text-slate-300">{challenge}</li>
                            ))
                        ) : (
                          <li className="text-sm text-slate-500">No challenges specified</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              
              <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between">
                <Button style={{ cursor: 'pointer' }} 
                  variant="outline"
                  type="button"
                  onClick={() => toggleView('edit')}
                >
                  Return to Edit
                </Button>
                
                <Button style={{ cursor: 'pointer' }} 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasChanges}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
      
          <TabsContent value="edit" className="mt-0">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Problem Details</CardTitle>
                  <CardDescription>
                    Update the information about the problem you're sharing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel htmlFor="title" className="text-base font-medium">Title</FormLabel>
                      <FormDescription>
                        Write a clear, concise title that summarizes the problem.
                      </FormDescription>
                      <FormControl>
                        <Input
                          id="title"
                          placeholder="e.g., Inefficient waste management in urban areas"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
                        />
                      </FormControl>
                      {renderErrorMessage('title')}
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel htmlFor="description" className="text-base font-medium">Description</FormLabel>
                      <FormDescription>
                        Provide a detailed explanation of the problem, its context, and why it's important.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          id="description"
                          placeholder="Describe the problem in detail..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className={`mt-1 min-h-32 ${errors.description ? 'border-red-500' : ''}`}
                        />
                      </FormControl>
                      {renderErrorMessage('description')}
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel htmlFor="category" className="text-base font-medium">Category</FormLabel>
                      <FormDescription>
                        Select the category that best fits your problem.
                      </FormDescription>
                      <FormControl>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {renderErrorMessage('category')}
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel htmlFor="tags" className="text-base font-medium">Tags</FormLabel>
                      <FormDescription>
                        Add up to 5 tags to help categorize the problem.
                      </FormDescription>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center">
                            {tag}
                            <button style={{ cursor: 'pointer' }} 
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex">
                        <FormControl>
                          <Input
                            id="tags"
                            placeholder="e.g., Sustainability"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            className={`rounded-r-none ${errors.tags ? 'border-red-500' : ''}`}
                            disabled={tags.length >= 5}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag(e);
                              }
                            }}
                          />
                        </FormControl>
                        <Button style={{ cursor: 'pointer' }} 
                          type="button"
                          onClick={handleAddTag}
                          className="rounded-l-none"
                          disabled={tags.length >= 5 || !tagInput.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {renderErrorMessage('tags')}
                      {tags.length >= 5 && (
                        <p className="text-sm text-amber-500 mt-1">Maximum number of tags reached (5)</p>
                      )}
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-base font-medium">Key Impacts</FormLabel>
                      <FormDescription>
                        List the main impacts or consequences of this problem.
                      </FormDescription>
                      <div className="space-y-3">
                        {impacts.map((impact, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                placeholder="e.g., Environmental pollution affecting local communities"
                                value={impact}
                                onChange={(e) => handleImpactChange(index, e.target.value)}
                                className={errors.impacts && !impact.trim() ? 'border-red-500' : ''}
                              />
                            </FormControl>
                            <Button style={{ cursor: 'pointer' }} 
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveImpact(index)}
                              disabled={impacts.length <= 1}
                              className={impacts.length <= 1 ? "invisible" : ""}
                            >
                              <MinusCircle className="h-5 w-5 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button style={{ cursor: 'pointer' }} 
                          type="button"
                          variant="ghost"
                          className="flex items-center mt-2"
                          onClick={handleAddImpact}
                          disabled={impacts.length >= 5}
                        >
                          <PlusCircle className="h-5 w-5 mr-1 text-green-500" />
                          Add Another Impact
                        </Button>
                      </div>
                      {renderErrorMessage('impacts')}
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-base font-medium">Challenges</FormLabel>
                      <FormDescription>
                        Identify the challenges or obstacles related to solving this problem.
                      </FormDescription>
                      <div className="space-y-3">
                        {challenges.map((challenge, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                placeholder="e.g., Limited public awareness about proper waste sorting"
                                value={challenge}
                                onChange={(e) => handleChallengeChange(index, e.target.value)}
                                className={errors.challenges && !challenge.trim() ? 'border-red-500' : ''}
                              />
                            </FormControl>
                            <Button style={{ cursor: 'pointer' }} 
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveChallenge(index)}
                              disabled={challenges.length <= 1}
                              className={challenges.length <= 1 ? "invisible" : ""}
                            >
                              <MinusCircle className="h-5 w-5 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button style={{ cursor: 'pointer' }} 
                          type="button"
                          variant="ghost"
                          className="flex items-center mt-2"
                          onClick={handleAddChallenge}
                          disabled={challenges.length >= 5}
                        >
                          <PlusCircle className="h-5 w-5 mr-1 text-green-500" />
                          Add Another Challenge
                        </Button>
                      </div>
                      {renderErrorMessage('challenges')}
                    </FormItem>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button style={{ cursor: 'pointer' }}  variant="outline" type="button">
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel problem editing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your changes will not be saved. Are you sure you want to cancel?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, continue editing</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push(`/problems/${problemId}`)}>
                          Yes, discard changes
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <div className="flex gap-2">
                    <Button style={{ cursor: 'pointer' }} 
                      variant="outline"
                      type="button"
                      onClick={() => toggleView('preview')}
                    >
                      Preview
                    </Button>
                    
                    <Button style={{ cursor: 'pointer' }} 
                      type="submit"
                      disabled={isSubmitting || !hasChanges}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  );
}