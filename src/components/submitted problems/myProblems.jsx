"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  MessageSquare, 
  ThumbsUp,
  Menu,
  X
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MyProblems() {
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);
  const [isTabsOpen, setIsTabsOpen] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProblems(currentUser);
      } else {
        // If not logged in, redirect to login
        router.push('/login?redirect=/my-problems');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserProblems = async (currentUser) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, "problems"),
        where("submittedBy", "==", currentUser.displayName || "Anonymous"),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const problemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setProblems(problemsData);
    } catch (error) {
      console.error("Error fetching problems:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your problems. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "problems", id));
      setProblems(problems.filter(problem => problem.id !== id));
      toast({
        title: "Problem Deleted",
        description: "Your problem has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the problem.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (id) => {
    router.push(`/edit/${id}`);
  };

  const filteredProblems = () => {
    if (activeTab === 'all') return problems;
    return problems.filter(problem => problem.category === activeTab);
  };

  // Get unique categories from user's problems
  const categories = [...new Set(problems.map(problem => problem.category))];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-16 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading your problems...</p>
        </div>
      </div>
    );
  }

  // Mobile category selector for small screens
  const MobileCategorySelector = () => (
    <Sheet open={isTabsOpen} onOpenChange={setIsTabsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden flex items-center gap-2 mb-4">
          <Menu className="h-4 w-4" />
          {activeTab === 'all' ? 'All Problems' : activeTab}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-72">
        <div className="flex flex-col gap-2 py-4">
          <Button 
            variant={activeTab === 'all' ? "default" : "ghost"}
            className="justify-start"
            onClick={() => {
              setActiveTab('all');
              setIsTabsOpen(false);
            }}
          >
            All Problems
          </Button>
          {categories.map(category => (
            <Button 
              key={category} 
              variant={activeTab === category ? "default" : "ghost"}
              className="justify-start"
              onClick={() => {
                setActiveTab(category);
                setIsTabsOpen(false);
              }}
            >
              {category}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col justify-start mb-6 md:mb-8">
        <Link href="/discover">
          <Button style={{ cursor: 'pointer' }} variant="ghost" className="mr-4 bg-black text-white">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="sm:inline">Back to Problems</span>
          </Button>
        </Link>
        
        <div className='mt-3'>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">My Problems</h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300">
            Manage the problems you've posted to the community.
          </p>
        </div>
      </div>
      
      {problems.length === 0 ? (
        <Card className="text-center py-8 md:py-16">
          <CardContent>
            <div className="flex flex-col items-center max-w-md mx-auto px-4">
              <h3 className="text-lg md:text-xl font-semibold mb-2">You haven't posted any problems yet</h3>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-6">
                Share real-world problems with the community and get innovative solutions.
              </p>
              <Link href="/post">
                <Button style={{ cursor: 'pointer' }}>Post Your First Problem</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile category selector */}
          <MobileCategorySelector />
          
          {/* Desktop tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 hidden md:block">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">All Problems</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProblems().map((problem) => (
              <Card key={problem.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 md:pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                      {problem.category}
                    </Badge>
                    <div className="flex items-center text-slate-500 text-xs">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {problem.votes || 0}
                      <MessageSquare className="h-3 w-3 ml-3 mr-1" />
                      {problem.discussions || 0}
                    </div>
                  </div>
                  <Link href={`/problems/${problem.id}`}>
                    <CardTitle className="text-base md:text-lg hover:text-blue-600 transition-colors">
                      {problem.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="mt-2 text-xs md:text-sm line-clamp-2 md:line-clamp-3">
                    {problem.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2 md:pb-3 flex-grow">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs truncate">
                        {tag}
                      </Badge>
                    ))}
                    {problem.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{problem.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Posted: {problem.createdAt}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between w-full">
                    <Button style={{ cursor: 'pointer' }} variant="ghost" size="sm" className="text-xs md:text-sm" onClick={() => handleEdit(problem.id)}>
                      <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button style={{ cursor: 'pointer' }}
                          variant="ghost" 
                          size="sm"
                          className="text-xs md:text-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(problem.id)}
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-xs md:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Problem</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this problem? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDelete(deleteId)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 md:mt-8 flex justify-center">
            <Link href="/post">
              <Button style={{ cursor: 'pointer' }}>Post New Problem</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}