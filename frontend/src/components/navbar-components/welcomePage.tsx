'use client'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react';
import ProblemCard from '@/components/problems/ProblemCard';
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { useTheme } from "next-themes";
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
import { toast } from "@/lib/toast-wrapper";
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === 'light';

  const categories = CATEGORIES;

  // Fetch problems from the API based on tab selection
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        let sortField = 'votes';
        const sortDir = 'desc';

        switch (activeTab) {
          case 'trending':
            sortField = 'votes';
            break;
          case 'recent':
            sortField = 'createdAt'; // the REST API uses "timestamp" still though in the map but we'll try "timestamp"
            break;
          case 'most-discussed':
            sortField = 'discussions';
            break;
        }

        // Since the backend List query param is generic, we use "timestamp" for recent
        if (activeTab === 'recent') {
          sortField = 'timestamp';
        }

        const problemsData = await api.get<any[]>(`/problems?sort=${sortField}&dir=${sortDir}`);

        let problemsList = Array.isArray(problemsData) ? problemsData : [];

        // Apply category filter if selected
        if (selectedCategory) {
          problemsList = problemsList.filter(p => p.category === selectedCategory);
        }

        setProblems(problemsList.slice(0, 3));
      } catch (error) {
        console.error("Error fetching problems:", error);
        toast({
          title: "Failed to load problems",
          description: "There was an error loading problems. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [activeTab, selectedCategory]);

  // Handle search functionality - redirect to discover page with search term
  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    // Redirect to the discover problems page with the search term
    router.push(`/discover?search=${encodeURIComponent(searchTerm)}`);
  };

  // Handle filter by category
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  // Handle email subscription
  const handleSubscribe = (e: React.SyntheticEvent) => {
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

  // Render a loading card with consistent sizing
  const renderLoadingCard = (key: number) => (
    <Card key={key} className="border border-border h-64">
      <CardHeader>
        <div className="h-4 w-20 bg-muted rounded animate-pulse mb-3"></div>
        <div className="h-6 w-full bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <CardFooter className="border-t border-border mt-auto pt-4">
        <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="-mt-16 min-h-screen relative w-full overflow-x-hidden">

      {/* Hero Section Container with Animated Background */}
      <BackgroundGradientAnimation
        containerClassName="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
        className="absolute z-50 inset-0 flex flex-col items-center justify-center pointer-events-none"
        gradientBackgroundStart={isLight ? "rgb(240, 245, 255)" : "rgb(15, 10, 30)"}
        gradientBackgroundEnd={isLight ? "rgb(255, 255, 255)" : "rgb(5, 5, 15)"}
        firstColor={isLight ? "160, 140, 255" : "60, 20, 180"}
        secondColor={isLight ? "255, 160, 200" : "180, 40, 200"}
        thirdColor={isLight ? "140, 200, 255" : "0, 150, 255"}
        fourthColor={isLight ? "255, 170, 170" : "255, 80, 120"}
        fifthColor={isLight ? "140, 255, 220" : "40, 200, 255"}
        pointerColor={isLight ? "170, 140, 255" : "150, 100, 255"}
        interactive={true}
      >
        <div className="inset-0 w-full max-w-7xl mx-auto px-4 relative z-50 pointer-events-auto">
          <div className="flex flex-col items-start text-left max-w-3xl">
            <div className="inline-block p-2 bg-primary/10 rounded-full mb-4 px-6 border border-primary/20 backdrop-blur-sm pointer-events-none select-none">
              <div className="text-primary font-medium tracking-wide">
                Problem-First, Not Solution-First
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 pointer-events-none select-none">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">SolvingHub</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed pointer-events-none select-none">
              The community-driven platform where real-world problems meet innovative solutions.
              Discover, discuss, and collaborate on problems that matter.
            </p>

            <div className="flex select-none flex-col sm:flex-row gap-4 mb-4">
              <Link href="/discover">
                <Button size="lg" className="shadow-lg cursor-pointer shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                  Discover Problems <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/post">
                <Button size="lg" variant="outline" className="border-primary/20 hover:!bg-white hover:!text-black cursor-pointer transition-colors">
                  Submit a Problem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundGradientAnimation>

      {/* Main Page Content */}
      <div className="container mx-auto px-4 mt-12">
        {/* Search and Filter */}
        <div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6 p-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for problems..."
                className="pl-10 flex h-12 w-full rounded-md border border-border bg-background/50 backdrop-blur-sm px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 p-4">
            {categories.map((category) => (
              <div
                key={category}
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ${selectedCategory === category
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                  }`}
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
            <CardHeader>
              <div className="mb-2 p-3 bg-primary/10 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Discussion-Centric</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every problem has a dedicated discussion thread to brainstorm openly and collaborate on solutions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
            <CardHeader>
              <div className="mb-2 p-3 bg-accent/10 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Community-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Voting and moderation brings relevant issues to the top, ensuring visibility for impactful problems.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
            <CardHeader>
              <div className="mb-2 p-3 bg-primary/10 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Structured & Searchable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Problems are categorized, tagged, and filterable for easy discovery across all domains.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-8 text-foreground relative inline-block">
            Featured Problems
            <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full"></div>
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
                  Array(3).fill(0).map((_, index) => renderLoadingCard(index))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      <ProblemCard problem={problem} layout="grid" />
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
                    <Button variant="outline" className="border-primary/20 hover:bg-primary/10 group">
                      View All Problems <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  // Show loading indicators with consistent height
                  Array(3).fill(0).map((_, index) => renderLoadingCard(index))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      <ProblemCard problem={problem} layout="grid" showCreatedAtDate={true} />
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
                    <Button variant="outline" className="border-primary/20 hover:bg-primary/10 group">
                      View All Recent Problems <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="most-discussed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  // Show loading indicators with consistent height
                  Array(3).fill(0).map((_, index) => renderLoadingCard(index))
                ) : problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className="h-full">
                      <ProblemCard problem={problem} layout="grid" />
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
                    <Button variant="outline" className="border-primary/20 hover:bg-primary/10 group">
                      View All Most Discussed Problems <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* How It Works */}
        <div className="mb-24 py-16 px-8 rounded-3xl bg-secondary/50 backdrop-blur-sm border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

          <h2 className="text-3xl font-bold mb-12 text-center text-foreground relative">
            How SolvingHub Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Discover Problems</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Browse real-world problems across various categories and domains
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Join Discussions</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Participate in discussions and brainstorm potential solutions
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Collaborate</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Form teams and work together on tackling challenging problems
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Build Solutions</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Create meaningful solutions with real-world impact
              </p>
            </div>
          </div>
        </div>

        {/* Join Community */}
        <Card className="border-border/50 bg-primary/5 backdrop-blur-md mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="text-2xl">Join Our Community</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Get notified about new problem statements and platform updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 relative z-10">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-12 w-full max-w-sm rounded-md border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="h-12 shadow-md shadow-primary/20">
                Subscribe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="border-t border-border/50 pt-8 mt-12 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} SolvingHub. All rights reserved. Created by Rohit Sadawarte, Rohit Singh, Rajnish Malviya, Ritik Pawar.
            </p>
            <div className="flex space-x-6">
              <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors h-auto p-0">About</Button>
              <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors h-auto p-0">Contact</Button>
              <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors h-auto p-0">FAQ</Button>
            </div>
          </div>
        </footer>
      </div>
    </div>

  );
}