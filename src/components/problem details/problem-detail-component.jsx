"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export default function ProblemDetail({ params }) {
  const router = useRouter();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [replyText, setReplyText] = useState({});
  const [showReplyBox, setShowReplyBox] = useState({});
  const [user, setUser] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const problemId = params?.id;

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch problem details
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/problems/${problemId}`);

        if (!response.ok) {
          throw new Error('Problem not found');
        }

        const data = await response.json();
        setProblem({
          ...data.problem,
          createdAt: calculateTimeAgo(new Date(data.problem.created_at))
        });
      } catch (error) {
        console.error("Error fetching problem:", error);
        setError("Failed to load problem details");
        toast.error("Error", {
          description: "Failed to load problem details. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Fetch comments with real-time subscription
  useEffect(() => {
    if (!problemId) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/problems/${problemId}/comments`);

        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();

    // Subscribe to real-time comment updates
    const channel = supabase
      .channel(`problem-${problemId}-comments`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `problem_id=eq.${problemId}`
        },
        (payload) => {
          // Add new comment to list
          fetchComments();
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies'
        },
        (payload) => {
          // Refresh comments when reply added
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [problemId]);

  // Check if user has voted
  useEffect(() => {
    if (!user || !problemId) return;

    const checkVote = async () => {
      const response = await fetch(`/api/problems/${problemId}/vote`);
      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.voted);
      }
    };

    checkVote();
  }, [user, problemId]);

  // Handle problem vote
  const handleVote = async () => {
    if (!user) {
      toast.error("Login Required", {
        description: "Please log in to vote on problems.",
      });
      router.push('/login');
      return;
    }

    try {
      const response = await api.post(`/api/problems/${problemId}/vote`, {});

      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.voted);
        setProblem(prev => ({ ...prev, votes: data.votes }));

        toast.success(data.voted ? "Upvoted!" : "Vote removed");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to vote. Please try again.",
      });
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Login Required", {
        description: "Please log in to comment.",
      });
      router.push('/login');
      return;
    }

    if (!commentText.trim()) {
      toast.error("Error", {
        description: "Comment cannot be empty.",
      });
      return;
    }

    try {
      const response = await api.post(`/api/problems/${problemId}/comments`, { text: commentText.trim() });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setCommentText('');
        toast.success("Comment posted!");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to post comment. Please try again.",
      });
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (commentId) => {
    if (!user) {
      toast.error("Login Required", {
        description: "Please log in to reply.",
      });
      router.push('/login');
      return;
    }

    const text = replyText[commentId];
    if (!text?.trim()) return;

    try {
      const response = await api.post(`/api/comments/${commentId}/replies`, { text: text.trim() });

      if (response.ok) {
        // Refresh comments to show new reply
        const commentsResponse = await fetch(`/api/problems/${problemId}/comments`);
        const data = await commentsResponse.json();
        setComments(data.comments);

        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
        toast.success("Reply posted!");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to post reply. Please try again.",
      });
    }
  };

  // Calculate time ago
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error || "Problem not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{problem.title}</CardTitle>
          <CardDescription>
            Posted {problem.createdAt} • Category: {problem.category}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{problem.description}</p>

          {/* Tags */}
          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {problem.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Vote Section */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant={hasVoted ? "default" : "outline"}
              size="sm"
              onClick={handleVote}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              {problem.votes || 0}
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{problem.discussions || 0} discussions</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="solutions">Proposed Solutions</TabsTrigger>
            </TabsList>

            {/* Discussion Tab */}
            <TabsContent value="discussion" className="space-y-4">
              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="space-y-2">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" size="sm">Post Comment</Button>
                </form>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Please <a href="/login" className="text-primary underline">log in</a> to comment
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-4 mt-6">
                {loadingComments ? (
                  <p>Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.users?.photo_url || ''} />
                            <AvatarFallback>{comment.users?.display_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{comment.users?.display_name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground mb-2">{comment.text}</p>

                            {/* Reply Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowReplyBox(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                            >
                              Reply
                            </Button>

                            {/* Reply Box */}
                            {showReplyBox[comment.id] && (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  placeholder="Write a reply..."
                                  value={replyText[comment.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  rows={2}
                                />
                                <Button size="sm" onClick={() => handleReplySubmit(comment.id)}>
                                  Post Reply
                                </Button>
                              </div>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-8 mt-3 space-y-3">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={reply.users?.photo_url || ''} />
                                      <AvatarFallback>{reply.users?.display_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-xs">{reply.users?.display_name || 'Anonymous'}</p>
                                      <p className="text-xs text-muted-foreground">{reply.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {problem.impacts && problem.impacts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Impacts</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {problem.impacts.map((impact, index) => (
                      <li key={index} className="text-muted-foreground">{impact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {problem.challenges && problem.challenges.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Challenges</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {problem.challenges.map((challenge, index) => (
                      <li key={index} className="text-muted-foreground">{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* Solutions Tab */}
            <TabsContent value="solutions">
              <p className="text-muted-foreground">No solutions proposed yet. Be the first to propose a solution!</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}