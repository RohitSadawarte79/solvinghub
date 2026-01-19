'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { useState, useEffect } from 'react';
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
  Search,
  Users,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Lightbulb,
  Filter,
  CheckCircle
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [mounted, setMounted] = useState(false);

  const categories = [
    "Education", "Technology", "Health", "Environment",
    "Food & Agriculture", "Transportation", "Finance", "Social"
  ];

  // Fetch problems from Supabase based on tab selection
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        console.log('Fetching problems...');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        let query = supabase
          .from('problems')
          .select('*')
          .limit(3);

        // Apply sorting based on active tab
        switch (activeTab) {
          case 'trending':
            query = query.order('votes', { ascending: false });
            break;
          case 'recent':
            query = query.order('created_at', { ascending: false });
            break;
          case 'most-discussed':
            query = query.order('discussions', { ascending: false });
            break;
          default:
            query = query.order('votes', { ascending: false });
        }

        // Apply category filter if selected
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }

        console.log('Executing query...');
        const { data, error } = await query;

        console.log('Query result:', { data, error });
        console.log('Has data:', !!data);
        console.log('Has error:', !!error);
        console.log('Data is:', data);
        console.log('Error is:', error);

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message || 'Query failed');
        }

        if (!data) {
          console.warn('No data returned from query');
          setProblems([]);
          return;
        }

        // Transform data to match expected format
        const problemsList = data.map(problem => ({
          id: problem.id,
          title: problem.title,
          description: problem.description,
          category: problem.category,
          votes: problem.votes || 0,
          discussions: problem.discussions || 0,
          tags: problem.tags || [],
          createdAt: calculateTimeAgo(new Date(problem.created_at))
        }));

        setProblems(problemsList);
      } catch (error) {
        console.error("Error fetching problems:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Error message:", error?.message);
        console.error("Error code:", error?.code);
        toast.error("Failed to load problems", {
          description: error?.message || "There was an error loading problems. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [activeTab, selectedCategory]);

  // Set mounted after first render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to calculate time ago
  const calculateTimeAgo = (date) => {
    if (!date) return "Unknown date";
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  // Handle search functionality - redirect to discover page with search term
  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    // Redirect to the discover problems page with the search term
    router.push(`/discover?search=${encodeURIComponent(searchTerm)}`);
  };

  // Handle filter by category
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  // Handle email subscription
  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send this to your backend/Firebase
    // For now, we'll just show a success message
    toast({
      title: "Subscription Successful",
      description: "Thank you for subscribing to our newsletter!"
    });

    setEmail('');
  };

  // Render a problem card with consistent sizing
  const renderLoadingCard = () => (
    <Card className="border border-slate-200 dark:border-slate-700 h-64">
      <CardHeader>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3"></div>
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
      </CardHeader>
      <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  );

  const renderProblemDetails = (problem) => (
    <>
      <div className="flex justify-between items-start">
        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs">
          {problem.category}
        </div>
        <div className="flex items-center text-sm text-slate-500">
          {activeTab === 'trending' && (
            <><TrendingUp className="h-4 w-4 mr-1" /> {problem.votes || 0}</>
          )}
          {activeTab === 'recent' && (
            <>{problem.createdAt}</>
          )}
          {activeTab === 'most-discussed' && (
            <><MessageSquare className="h-4 w-4 mr-1" /> {problem.discussions || 0}</>
          )}
        </div>
      </div>
      <CardTitle className="mt-3 text-lg">{problem?.title}</CardTitle>
      <CardDescription className="mt-2 line-clamp-2">
        {problem?.description}
      </CardDescription>
    </>
  );

  const renderProblemCard = (problem, loading = false) => {
    if (loading) {
      return renderLoadingCard();
    }

    return (
      <Card className="border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer h-full flex flex-col" key={problem?.id}>
        <CardHeader>
          {renderProblemDetails(problem)}
        </CardHeader>
        <CardFooter className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center text-sm text-slate-500">
            {activeTab === 'trending' && (
              <><MessageSquare className="h-4 w-4 mr-1" /> {problem.discussions || 0} discussions</>
            )}
            {activeTab === 'recent' && (
              <><MessageSquare className="h-4 w-4 mr-1" /> {problem.discussions || 0} discussions</>
            )}
            {activeTab === 'most-discussed' && (
              <><TrendingUp className="h-4 w-4 mr-1" /> {problem.votes || 0} votes</>
            )}
          </div>
          <div className="text-blue-600 text-sm font-medium">
            View Details
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Prevent hydration mismatch from browser extensions
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-block p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Problem-First, Not Solution-First
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-6">
            Welcome to <span className="text-blue-600 dark:text-blue-400">SolvingHub</span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-8">
            The community-driven platform where real-world problems meet innovative solutions.
            Discover, discuss, and collaborate on problems that matter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/discover">
              <Button style={{ cursor: 'pointer' }} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Discover Problems <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/submit">
              <Button style={{ cursor: 'pointer' }} size="lg" variant="outline">
                Submit a Problem
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6 p-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for problems..."
                className="pl-10 flex h-12 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button style={{ cursor: 'pointer' }} type="submit" variant="outline" className="h-12">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 p-4">
            {categories.map((category) => (
              <div
                key={category}
                className={`inline-block px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${selectedCategory === category
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="mb-2">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Discussion-Centric</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Every problem has a dedicated discussion thread to brainstorm openly and collaborate on solutions.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="mb-2">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Community-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Voting and moderation brings relevant issues to the top, ensuring visibility for impactful problems.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="mb-2">
                <Filter className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Structured & Searchable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300">
                Problems are categorized, tagged, and filterable for easy discovery across all domains.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Problems */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-50">
            Featured Problems
          </h2>

          <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="most-discussed">Most Discussed</TabsTrigger>
            </TabsList>

            <TabsContent value="trending">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  // Show loading indicators with consistent height
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="h-full">
                      {renderProblemCard(null, true)}
                    </div>
                  ))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      {renderProblemCard(problem)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center p-12 text-slate-500">
                    <p>No problems found. {selectedCategory && "Try removing the category filter."}</p>
                  </div>
                )}
              </div>

              {problems.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Link href="/discover">
                    <Button style={{ cursor: 'pointer' }} variant="outline">
                      View All Problems <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  // Show loading indicators with consistent height
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="h-full">
                      {renderProblemCard(null, true)}
                    </div>
                  ))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      {renderProblemCard(problem)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center p-12 text-slate-500">
                    <p>No problems found. {selectedCategory && "Try removing the category filter."}</p>
                  </div>
                )}
              </div>

              {problems.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Link href="/discover?sort=recent">
                    <Button style={{ cursor: 'pointer' }} variant="outline">
                      View All Recent Problems <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="most-discussed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  // Show loading indicators with consistent height
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="h-full">
                      {renderProblemCard(null, true)}
                    </div>
                  ))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      {renderProblemCard(problem)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center p-12 text-slate-500">
                    <p>No problems found. {selectedCategory && "Try removing the category filter."}</p>
                  </div>
                )}
              </div>

              {problems.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Link href="/discover?sort=most-discussed">
                    <Button style={{ cursor: 'pointer' }} variant="outline">
                      View All Most Discussed Problems <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-slate-50">
            How SolvingHub Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Discover Problems</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Browse real-world problems across various categories and domains
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Join Discussions</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Participate in discussions and brainstorm potential solutions
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Collaborate</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Form teams and work together on tackling challenging problems
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Build Solutions</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Create meaningful solutions with real-world impact
              </p>
            </div>
          </div>
        </div>

        {/* Join Community */}
        <Card className="border border-slate-200 dark:border-slate-700 mb-16">
          <CardHeader>
            <CardTitle>Join Our Community</CardTitle>
            <CardDescription>Get notified about new problem statements and platform updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button style={{ cursor: 'pointer' }} type="submit" className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4 md:mb-0">
              © 2025 SolvingHub. All rights reserved. Created by Rohit Sadawarte, Rohit Singh, Rajnish Malviya, Ritik Pawar.
            </p>
            <div className="flex space-x-4">
              <Button style={{ cursor: 'pointer' }} variant="ghost" size="sm">About</Button>
              <Button style={{ cursor: 'pointer' }} variant="ghost" size="sm">Contact</Button>
              <Button style={{ cursor: 'pointer' }} variant="ghost" size="sm">FAQ</Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}