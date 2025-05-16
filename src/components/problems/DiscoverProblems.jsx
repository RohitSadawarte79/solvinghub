"use client"; // For Next.js client components

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Button 
} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { 
  Search,
  Filter,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  Calendar,
  ThumbsUp,
  Users,
  Clock,
  PlusCircle
} from 'lucide-react';

// Firebase imports
import { collection, getDocs, query, orderBy, getFirestore } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { app } from '@/lib/firebase'; // Import the Firebase app instance


export default function DiscoverProblems() {
  const router = useRouter();
  //const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('votes');
  const [currentPage, setCurrentPage] = useState(1);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const problemsPerPage = 6;
  
  const categories = [
    "All Categories", "Education", "Technology", "Health", "Environment", 
    "Food & Agriculture", "Transportation", "Finance", "Social"
  ];
  
  const sortOptions = [
    { label: "Most Voted", value: "votes" },
    { label: "Most Discussed", value: "discussions" },
    { label: "Newest", value: "timestamp" },
    { label: "Alphabetical", value: "title" }
  ];
  // Get Firestore instance
  const db = getFirestore(app);
  
  // Define fetchProblems function before using it
  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we have a valid Firestore instance
      if (!db) {
        throw new Error("Firestore database not initialized");
      }
      
      // Create a reference to the problems collection
      const problemsRef = collection(db, "problems");
      
      // Create a query based on the sort option
      let q;
      switch (sortBy) {
        case 'votes':
          q = query(problemsRef, orderBy("votes", "desc"));
          break;
        case 'discussions':
          q = query(problemsRef, orderBy("discussions", "desc"));
          break;
        case 'timestamp':
          q = query(problemsRef, orderBy("timestamp", "desc"));
          break;
        case 'title':
          q = query(problemsRef, orderBy("title", "asc"));
          break;
        default:
          q = query(problemsRef, orderBy("votes", "desc"));
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Map the documents to our problems array
      const problemsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firebase Timestamp to relative time string
          createdAt: data.timestamp ? calculateTimeAgo(data.timestamp.toDate()) : "Unknown date",
          // Ensure all required fields have default values to prevent undefined errors
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          votes: data.votes || 0,
          discussions: data.discussions || 0,
          tags: data.tags || []
        };
      });

      // console.log(problemsData);
      
      setProblems(problemsData);
    } catch (error) {
      console.error("Error fetching problems:", error);
      setError("Failed to load problems. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load problems. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate time ago (e.g., "3 days ago")
  const calculateTimeAgo = (date) => {
    if (!date) return "Unknown date";
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    
    return Math.floor(seconds) + " seconds ago";
  };
  
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedCategories, searchQuery]);
  
  const handleCategoryToggle = (category) => {
    if (category === "All Categories") {
      setSelectedCategories([]);
      return;
    }
    
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Effect hook to fetch problems when component mounts or when sortBy changes
  useEffect(() => {
    fetchProblems();
  }, [sortBy]); // Removed db dependency as it shouldn't change
  const handleSortChange = (value) => {
    setSortBy(value);
  };
  
  const handleCreateProblem = () => {
    // Check if user is logged in before redirecting
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a problem.",
        variant: "destructive"
      });
      return;
    }
    router.push('/post');
  };
  
  // Filter problems based on search query and selected categories
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = searchQuery === '' || 
      problem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(problem.category);
      
    return matchesSearch && matchesCategory;
  });
  
  // Calculate current problems to display based on pagination
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / problemsPerPage));
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of page numbers to show
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Discover Problems</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Browse through real-world problems submitted by our community and find opportunities to make an impact.
              </p>
            </div>
          </div>
          <Link href="/post" passHref>
            <Button 
              className="mt-4 md:mt-0"
              onClick={handleCreateProblem}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Problem
            </Button>
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for problems..." 
                className="pl-10 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={selectedCategories.includes(category) ? "bg-blue-50 dark:bg-blue-900" : ""}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort by <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sortOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Active filters */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <div 
                  key={category} 
                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {category}
                  <button 
                    className="ml-2 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setSelectedCategories([])}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* View options: List or Grid */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing {filteredProblems.length} problems
          </div>
          
          <Tabs defaultValue="grid" className="w-auto">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchProblems}
            >
              Try Again
            </Button>
          </div>
        ) : (
          /* Problem Grid/List */
          <Tabs defaultValue="grid" className="mb-8">
            <TabsContent value="grid">
              {currentProblems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProblems.map((problem) => (
                    <Card 
                      key={problem.id} 
                      className="border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => router.push(`/problem/${problem.id}`)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
                            {problem.category}
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <TrendingUp className="h-4 w-4 mr-1" /> {problem.votes}
                          </div>
                        </div>
                        <CardTitle className="mt-3">{problem.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {problem.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {problem.tags && problem.tags.map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <div className="flex items-center mr-4">
                            <MessageSquare className="h-4 w-4 mr-1" /> {problem.discussions || 0}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> {problem.createdAt}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300">No problems match your current filters.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list">
              {currentProblems.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {currentProblems.map((problem) => (
                    <Card 
                      key={problem.id} 
                      className="border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => navigateToProblemDetail(problem.id)}
                    >
                      <div className="flex flex-col md:flex-row p-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
                              {problem.category}
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <Calendar className="h-4 w-4 mr-1" /> {problem.createdAt}
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <Users className="h-4 w-4 mr-1" /> {problem.submittedBy}
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
                            {problem.title}
                          </h3>
                          
                          <p className="text-slate-600 dark:text-slate-300 mb-3">
                            {problem.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {problem.tags && problem.tags.map((tag, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-4 justify-between mt-4 md:mt-0 md:ml-6 md:min-w-24">
                          <div className="flex flex-col items-center">
                            <ThumbsUp className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium">{problem.votes}</span>
                            <span className="text-xs text-slate-500">Votes</span>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium">{problem.discussions || 0}</span>
                            <span className="text-xs text-slate-500">Replies</span>
                          </div>
                          
                          <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-300">No problems match your current filters.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((number, index) => (
                <PaginationItem key={index}>
                  {number === '...' ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(number);
                      }}
                      isActive={currentPage === number}
                    >
                      {number}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}