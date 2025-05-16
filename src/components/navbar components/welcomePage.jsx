'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { useState } from 'react';
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

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  
  const categories = [
    "Education", "Technology", "Health", "Environment", 
    "Agriculture", "Transportation", "Finance", "Social"
  ];
  
  const featuredProblems = [
    {
      title: "Inefficient waste management in urban areas",
      category: "Environment",
      votes: 142,
      discussions: 27
    },
    {
      title: "Limited access to quality education in rural communities",
      category: "Education",
      votes: 98,
      discussions: 19
    },
    {
      title: "Mental health resources for college students",
      category: "Health",
      votes: 87,
      discussions: 31
    }
  ];
  
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
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Discover Problems <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
            </Link>
            <Link href="/post">
            <Button size="lg" variant="outline">
              Submit a Problem
            </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for problems..." 
                className="pl-10 flex h-12 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <Button variant="outline" className="h-12">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category} className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm">
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
          
          <Tabs defaultValue="trending">
            <TabsList className="mb-6">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="most-discussed">Most Discussed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProblems.map((problem, index) => (
                  <Card key={index} className="border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors">
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
                    </CardHeader>
                    <CardFooter className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <MessageSquare className="h-4 w-4 mr-1" /> {problem.discussions} discussions
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recent">
              <div className="flex items-center justify-center p-8 text-slate-500">
                <p>Switch to the Trending tab to see featured problems</p>
              </div>
            </TabsContent>
            
            <TabsContent value="most-discussed">
              <div className="flex items-center justify-center p-8 text-slate-500">
                <p>Switch to the Trending tab to see featured problems</p>
              </div>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4 md:mb-0">
              © 2025 SolvingHub. All rights reserved. Created by Rohit Sadawarte, Rohit Singh, Rajnish Malviya, Ritik Pawar.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm">About</Button>
              <Button variant="ghost" size="sm">Contact</Button>
              <Button variant="ghost" size="sm">FAQ</Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}