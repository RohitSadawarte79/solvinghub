"use client"; // For Next.js client components

import { CATEGORIES } from '@/lib/constants';
import { calculateTimeAgo } from '@/lib/timeUtils';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button
} from '@/components/ui/button';
import ProblemCard from '@/components/problems/ProblemCard';
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
  ChevronDown,
  PlusCircle,
  LayoutGrid,
  List
} from 'lucide-react';

import { toast } from '@/lib/toast-wrapper';
import { api, getUserFromToken } from '@/lib/api';

const sortOptions = [
  { label: "Most Voted", value: "votes" },
  { label: "Most Discussed", value: "discussions" },
  { label: "Newest", value: "timestamp" },
  { label: "Alphabetical", value: "title" }
];

export default function DiscoverProblems() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('votes');
  const [currentPage, setCurrentPage] = useState(1);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('grid');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const problemsPerPage = 6;

  const categories = ["All Categories", ...CATEGORIES];

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
  }, [viewMode]);

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
  const fetchProblems = useCallback(async () => {
    if (!isMounted) return;

    setLoading(true);
    setError(null);

    try {

      // Create an index map for sorting options
      const sortIndexMap: Record<string, string> = {
        votes: 'votes',
        discussions: 'discussions',
        timestamp: 'timestamp',
        title: 'title'
      };

      // Use the correct field for sorting
      const sortField = sortIndexMap[sortBy] || 'votes';
      const sortDirection = sortBy === 'title' ? 'asc' : 'desc';

      const problemsData = await api.get<any[]>(`/problems?sort=${sortField}&dir=${sortDirection}`);

      const formattedProblems = (problemsData || []).map(data => ({
        id: data.id,
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        votes: data.votes || 0,
        discussions: data.discussions || 0,
        tags: data.tags || [],
        createdAt: data.createdAt ? calculateTimeAgo(new Date(data.createdAt)) : "Unknown date",
      }));

      setProblems(formattedProblems as any);
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
  }, [sortBy, isMounted]);
  // calculateTimeAgo imported from @/lib/timeUtils

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedCategories, searchQuery]);

  const handleCategoryToggle = (category: string) => {
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

  // Effect hook to fetch problems when component mounts or when fetchProblems changes
  useEffect(() => {
    if (isMounted) {
      fetchProblems();
    }
  }, [fetchProblems, isMounted]);

  const handleSortChange = (value: string) => {
    setSortBy(value);

    if (!searchParams) return;

    // Update URL to reflect the sorting option without page reload
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sort', value);

    // Use router.replace to update URL without adding to history stack
    router.replace(`/discover?${newParams.toString()}`);
  };

  // Handle search submission - update URL and state
  const handleSearch = (e: React.FormEvent) => {
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
    if (!getUserFromToken()) {
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
  const handleKeyDown = (e: React.KeyboardEvent, problemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/problems/${problemId}`);
    }
  };

  // Filter problems based on search query and selected categories
  const filteredProblems = problems.filter((problem: any) => {
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
    const pageNumbers: (number | string)[] = [];

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
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 sm:mb-8">
          <div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 relative inline-block">
                Discover Problems
                <div className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></div>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Browse through real-world problems submitted by our community.
              </p>
            </div>
          </div>
          <Link href="/post" passHref>
            <Button
              className="mt-4 md:mt-0 w-full md:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
              onClick={handleCreateProblem}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Problem
            </Button>
          </Link>
        </div>
        <div className="bg-background/50 backdrop-blur-md rounded-xl border border-border/50 shadow-sm p-3 sm:p-4 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-4 sm:mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for problems..."
                className="pl-10 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" className="flex-grow sm:flex-grow-0 border-primary/20 hover:bg-primary/10">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-grow sm:flex-grow-0 border-primary/20 hover:bg-primary/10">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-md border-border/50">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={selectedCategories.includes(category) ? "bg-primary/10 text-primary font-medium" : "hover:bg-primary/5"}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-grow sm:flex-grow-0 border-primary/20 hover:bg-primary/10">
                    Sort by <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background/95 backdrop-blur-md border-border/50">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className="hover:bg-primary/5"
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
                  className="inline-flex items-center px-3 py-1 bg-primary text-primary-foreground shadow-sm shadow-primary/20 rounded-full text-xs font-medium"
                >
                  {category}
                  <button
                    className="ml-2 text-primary-foreground/70 hover:text-primary-foreground"
                    onClick={() => handleCategoryToggle(category)}
                    aria-label={`Remove ${category} filter`}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                className="text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors ml-2"
                onClick={() => setSelectedCategories([])}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* View options: List or Grid */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Showing {filteredProblems.length} problems
          </div>

          <div className="flex items-center">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-r-none ${viewMode === 'grid' ? 'shadow-md shadow-primary/20' : ''}`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-l-none ${viewMode === 'list' ? 'shadow-md shadow-primary/20' : ''}`}
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-primary/20 hover:bg-primary/10 transition-colors"
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
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      layout="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No problems found</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">We couldn't find any problems matching your current search and filter criteria.</p>
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      // Also clear URL parameters
                      router.replace('/discover');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )
            ) : (
              currentProblems.length > 0 ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {currentProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      layout="list"
                      showCreatedAtDate={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No problems found</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">We couldn't find any problems matching your current search and filter criteria.</p>
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      // Also clear URL parameters
                      router.replace('/discover');
                    }}
                  >
                    Clear All Filters
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
                          setCurrentPage(number as number);
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