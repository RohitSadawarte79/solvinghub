"use client"; // For Next.js client components

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  PlusCircle,
  LayoutGrid,
  List
} from 'lucide-react';

// Firebase imports
import { collection, getDocs, query, orderBy, getFirestore } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { app } from '@/lib/firebase'; // Import the Firebase app instance

export default function DiscoverProblems() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('votes');
  const [currentPage, setCurrentPage] = useState(1);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  
  // Add client-side lifecycle check
  useEffect(() => {
    setIsMounted(true);
    
    // Set mobile state based on window width
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (window.innerWidth < 640 && viewMode === 'grid') {
        setViewMode('list');
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Initialize search query from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const sort = searchParams.get('sort');
    if (sort && sortOptions.some(option => option.value === sort)) {
      setSortBy(sort);
    }
  }, [searchParams]);
  
  // Define fetchProblems function
  const fetchProblems = async () => {
    if (!isMounted) return;

    setLoading(true);
    setError(null);

    try {
      const db = getFirestore(app);
      if (!db) throw new Error("Firestore database not initialized");

      // Create an index map for sorting options
      const sortIndexMap = {
        votes: 'votes',
        discussions: 'discussions',
        timestamp: 'timestamp',
        title: 'title'
      };

      // Use the correct field for sorting
      const sortField = sortIndexMap[sortBy] || 'votes';
      const sortDirection = sortBy === 'title' ? 'asc' : 'desc';

      // Calculate pagination limits - fetch just what we need for current view plus some buffer
      const fetchLimit = problemsPerPage * 3; // Fetch 3 pages worth for smoother pagination

      // Create an optimized query with pagination
      const problemsRef = collection(db, "problems");
      const q = query(
        problemsRef, 
        orderBy(sortField, sortDirection),
        // limit(fetchLimit) // Uncomment to add hard limit if needed
      );

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process data more efficiently using array operations instead of iterating
      const problemsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Only extract the fields we need
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          votes: data.votes || 0,
          discussions: data.discussions || 0,
          tags: data.tags || [],
          // Calculate time ago only for visible items to reduce processing
          createdAt: data.timestamp ? calculateTimeAgo(data.timestamp.toDate()) : "Unknown date",
        };
      });

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
    if (isMounted) {
      fetchProblems();
    }
  }, [sortBy, isMounted]); 
  
  const handleSortChange = (value) => {
    setSortBy(value);
    
    if (!searchParams) return;
    
    // Update URL to reflect the sorting option without page reload
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sort', value);
    
    // Use router.replace to update URL without adding to history stack
    router.replace(`/discover?${newParams.toString()}`);
  };
  
  // Handle search submission - update URL and state
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchParams) return;
    
    // Update URL to reflect the search
    const newParams = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    
    // Use router.replace to update URL without adding to history stack
    router.replace(`/discover?${newParams.toString()}`);
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
  
  // Handle keyboard navigation
  const handleKeyDown = (e, problemId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/problems/${problemId}`);
    }
  };
  
  // Filter problems based on search query and selected categories
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = searchQuery === '' || 
      (problem.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (problem.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
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
    const maxPagesToShow = isMobile ? 3 : 5;
    const pageNumbers = [];

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, Math.min(currentPage - 1, totalPages - maxPagesToShow + 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);

    pageNumbers.push(1); // Always include the first page
    if (startPage > 2) pageNumbers.push('...'); // Ellipsis if there's a gap
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i); // Middle pages
    if (endPage < totalPages - 1) pageNumbers.push('...'); // Ellipsis if there's a gap
    pageNumbers.push(totalPages); // Always include the last page

    return pageNumbers;
  };
  
  // Guard against server-side rendering issues
  if (!isMounted) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 sm:mb-8">
          <div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Discover Problems</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Browse through real-world problems submitted by our community.
              </p>
            </div>
          </div>
          <Link href="/post" passHref>
            <Button style={{ cursor: 'pointer' }}
              className="mt-4 md:mt-0 w-full md:w-auto"
              onClick={handleCreateProblem}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Problem
            </Button>
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 sm:p-4 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-4 sm:mb-6">
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
            
            <div className="flex flex-wrap gap-2">
              <Button style={{ cursor: 'pointer' }} type="submit" variant="outline" className="flex-grow sm:flex-grow-0">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button style={{ cursor: 'pointer' }} variant="outline" className="flex-grow sm:flex-grow-0">
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
                  <Button style={{ cursor: 'pointer' }} variant="outline" className="flex-grow sm:flex-grow-0">
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
          </form>
          
          {/* Active filters */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <div 
                  key={category} 
                  className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                >
                  {category}
                  <button style={{ cursor: 'pointer' }}
                    className="ml-1 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                    onClick={() => handleCategoryToggle(category)}
                    aria-label={`Remove ${category} filter`}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button style={{ cursor: 'pointer' }}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setSelectedCategories([])}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* View options: List or Grid */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Showing {filteredProblems.length} problems
          </div>
          
          <div className="flex items-center">
            <Button 
              variant={viewMode === 'grid' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Grid</span>
            </Button>
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">List</span>
            </Button>
          </div>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <Button style={{ cursor: 'pointer' }}
              variant="outline" 
              className="mt-4"
              onClick={fetchProblems}
            >
              Try Again
            </Button>
          </div>
        ) : (
          /* Problem Grid/List */
          <div className="mb-6 sm:mb-8">
            {viewMode === 'grid' ? (
              currentProblems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {currentProblems.map((problem) => (
                    <Link 
                      href={`/problems/${problem.id}`} 
                      key={problem.id}
                      className="block no-underline h-full"
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-md transition h-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex flex-col"
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, problem.id)}
                        role="button"
                        aria-label={`View details for ${problem.title}`}
                      >
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                          <div className="flex justify-between items-start">
                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
                              {problem.category}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-slate-500">
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.votes}
                            </div>
                          </div>
                          <CardTitle className="mt-2 sm:mt-3 text-base sm:text-lg line-clamp-1">{problem.title}</CardTitle>
                          <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2">
                            {problem.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 px-3 sm:px-6 flex-grow">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {problem.tags && problem.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                            {problem.tags && problem.tags.length > 3 && (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                +{problem.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 px-3 sm:px-6 mt-auto text-xs sm:text-sm">
                          <div className="flex items-center text-slate-500">
                            <div className="flex items-center mr-3 sm:mr-4">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.discussions || 0}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.createdAt}
                            </div>
                          </div>
                          <Button style={{ cursor: 'pointer' }} variant="ghost" size="sm" className="text-blue-600 text-xs">
                            View
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-slate-600 dark:text-slate-300">No problems match your current filters.</p>
                  <Button style={{ cursor: 'pointer' }}
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      // Also clear URL parameters
                      router.replace('/discover');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )
            ) : (
              currentProblems.length > 0 ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {currentProblems.map((problem) => (
                    <Link 
                      href={`/problems/${problem.id}`}
                      key={problem.id}
                      className="block no-underline"
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-md transition border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, problem.id)}
                        role="button"
                        aria-label={`View details for ${problem.title}`}
                      >
                        <div className="flex flex-col p-3 sm:p-4">
                          <div className="flex flex-row items-start justify-between mb-2">
                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
                              {problem.category}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-slate-500">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.createdAt}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-1 sm:mb-2 text-slate-900 dark:text-slate-50 line-clamp-1">
                            {problem.title}
                          </h3>
                          
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-2 sm:mb-3 line-clamp-2">
                            {problem.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                            {problem.tags && problem.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                            {problem.tags && problem.tags.length > 3 && (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                +{problem.tags.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm">
                              <div className="flex items-center text-slate-500">
                                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.votes}
                              </div>
                              <div className="flex items-center text-slate-500">
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.discussions || 0}
                              </div>
                            </div>
                            
                            <Button style={{ cursor: 'pointer' }} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 h-auto">
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-slate-600 dark:text-slate-300">No problems match your current filters.</p>
                  <Button style={{ cursor: 'pointer' }}
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      // Also clear URL parameters
                      router.replace('/discover');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination className="mt-4 sm:mt-6">
            <PaginationContent className="flex-wrap">
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
              
              {/* On mobile, show minimal pagination */}
              {isMobile ? (
                <PaginationItem>
                  <span className="flex items-center justify-center h-10 w-10 text-sm">
                    {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
              ) : (
                getPageNumbers().map((number, index) => (
                  <PaginationItem key={index} className="hidden sm:block">
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
                ))
              )}
              
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