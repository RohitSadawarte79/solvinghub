"use client"

import { calculateTimeAgo } from '@/lib/timeUtils';

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
  Lightbulb
} from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "@/lib/toast-wrapper";

import { api, getUserFromToken, solutionsApi } from '@/lib/api';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { RankBadge } from '@/components/ui/rank-badge';
import type { Rank } from '@/types';

interface ProblemDetailProps {
  params: { id: string };
}

export default function ProblemDetail({ params }: ProblemDetailProps) {
  const router = useRouter();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [replyText, setReplyText] = useState<any>({});
  const [showReplyBox, setShowReplyBox] = useState<any>({});
  const [userVotes, setUserVotes] = useState({
    problem: false,
    comments: {}
  });
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [solutionsError, setSolutionsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userVotedSolutions, setUserVotedSolutions] = useState<Set<string>>(new Set());
  const [solutionFilter, setSolutionFilter] = useState<'all' | 'accepted' | 'recommended'>('all');

  // Get the problem ID from the params
  const problemId = params?.id;

  // Extract from token sync
  const currentUser = getUserFromToken();

  // Fetch problem details
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;

      setLoading(true);
      setError(null);

      try {
        const problemData = await api.get<any>(`/problems/${problemId}`);
        setProblem({
          ...problemData,
          createdAt: problemData.createdAt ? calculateTimeAgo(new Date(problemData.createdAt)) : "Unknown date"
        });
      } catch (error) {
        console.error("Error fetching problem:", error);
        setError("Failed to load problem details");
        toast({
          title: "Error",
          description: "Failed to load problem details. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Fetch and subscribe to comments via polling
  useEffect(() => {
    if (!problemId) return;

    let isMounted = true;
    setLoadingComments(true);

    const fetchComments = async () => {
      try {
        const commentsData = await api.get<any[]>(`/problems/${problemId}/comments`);

        if (!isMounted) return;

        const formattedComments = commentsData.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? calculateTimeAgo(new Date(c.createdAt)) : "Unknown date",
          replies: (c.replies || []).map((r: any) => ({
            ...r,
            createdAt: r.createdAt ? calculateTimeAgo(new Date(r.createdAt)) : "Unknown date"
          }))
        }));

        setComments(formattedComments as any);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching comments:", error);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    };

    fetchComments();
    const intervalId = setInterval(fetchComments, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [problemId]);

  // Fetch solutions when switching to solutions tab
  useEffect(() => {
    if (activeTab !== 'solutions') return;

    const fetchSolutions = async () => {
      if (!problemId) return;

      setLoadingSolutions(true);
      setSolutionsError(null);

      try {
        const solutionsData = await solutionsApi.getByProblem(problemId);
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error('Error fetching solutions:', error);
        setSolutionsError('Failed to load solutions. Please try again.');
      } finally {
        setLoadingSolutions(false);
      }
    };

    fetchSolutions();
  }, [activeTab, problemId]);

  // Check if current user is the problem owner
  const isProblemOwner = currentUser && problem?.submittedById === currentUser.uid;

  // Handle accepting a solution (problem owner only)
  const handleAcceptSolution = async (solutionId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept solutions.",
        variant: "destructive"
      });
      return;
    }

    if (!isProblemOwner) {
      toast({
        title: "Permission Denied",
        description: "Only the problem owner can accept solutions.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(solutionId);
    try {
      await solutionsApi.accept(solutionId);

      // Update local state (use functional update to avoid stale closure)
      setSolutions(prev => prev.map(s =>
        s.id === solutionId
          ? { ...s, status: 'accepted' }
          : { ...s, status: s.status === 'accepted' ? null : s.status }
      ));

      toast({
        title: "Solution Accepted",
        description: "This solution has been marked as accepted."
      });
    } catch (error) {
      console.error('Error accepting solution:', error);
      toast({
        title: "Error",
        description: "Failed to accept the solution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle recommending a solution (problem owner only)
  const handleRecommendSolution = async (solutionId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to recommend solutions.",
        variant: "destructive"
      });
      return;
    }

    if (!isProblemOwner) {
      toast({
        title: "Permission Denied",
        description: "Only the problem owner can recommend solutions.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(solutionId);
    try {
      await solutionsApi.recommend(solutionId);

      // Update local state (use functional update to avoid stale closure)
      // Only one solution can be recommended at a time (unless already accepted)
      setSolutions(prev => prev.map(s =>
        s.id === solutionId
          ? { ...s, status: s.status === 'accepted' ? 'accepted' : 'recommended' }
          : { ...s, status: s.status === 'recommended' ? null : s.status }
      ));

      toast({
        title: "Solution Recommended",
        description: "This solution has been marked as recommended."
      });
    } catch (error) {
      console.error('Error recommending solution:', error);
      toast({
        title: "Error",
        description: "Failed to recommend the solution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle voting on a solution
  const handleVoteSolution = async (solutionId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on solutions.",
        variant: "destructive"
      });
      router.push(`/login?redirect=/problems/${problemId}`);
      return;
    }

    if (actionLoading) return;

    setActionLoading(solutionId);
    try {
      const response = await solutionsApi.vote(solutionId);

      // Update local state
      setSolutions(prev => prev.map(s =>
        s.id === solutionId
          ? { ...s, hasVoted: response.voted, votesCount: response.voted ? (s.votesCount || 0) + 1 : Math.max(0, (s.votesCount || 0) - 1) }
          : s
      ));

      // Update voted solutions set
      setUserVotedSolutions(prev => {
        const next = new Set(prev);
        if (response.voted) {
          next.add(solutionId);
        } else {
          next.delete(solutionId);
        }
        return next;
      });

      toast({
        title: response.voted ? "Vote Added" : "Vote Removed",
        description: response.voted ? "Your vote has been added to this solution." : "Your vote has been removed."
      });
    } catch (error) {
      console.error('Error voting on solution:', error);
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // calculateTimeAgo imported from @/lib/timeUtils

  // Handle problem upvote
  const handleVoteProblem = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on problems.",
        variant: "destructive"
      });
      router.push('/login?redirect=/problems/' + problemId);
      return;
    }

    try {
      const response = await api.post<any>(`/problems/${problemId}/vote`, {});

      if (response.voted) {
        setProblem((prev: any) => prev ? { ...prev, votes: prev.votes + 1 } : prev);
        setUserVotes((prev: { problem: boolean; comments: Record<string, boolean> }) => ({ ...prev, problem: true }));
        toast({
          title: "Vote Added",
          description: "Your vote has been added to this problem."
        });
      } else {
        setProblem((prev: any) => prev ? { ...prev, votes: prev.votes - 1 } : prev);
        setUserVotes((prev: { problem: boolean; comments: Record<string, boolean> }) => ({ ...prev, problem: false }));
        toast({
          title: "Vote Removed",
          description: "Your vote has been removed from this problem."
        });
      }
    } catch (error) {
      console.error("Error voting on problem:", error);
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  // TODO: Implement comment voting in a future update

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a comment.",
        variant: "destructive"
      });
      router.push('/login?redirect=/problems/' + problemId);
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      await api.post(`/problems/${problemId}/comments`, {
        text: commentText
      });

      // Update local state optimistically
      setProblem((prev: any) => prev ? { ...prev, discussions: prev.discussions + 1 } : prev);
      setCommentText('');

      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the discussion."
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (commentId: string, replyTextToPost: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply to comments.",
        variant: "destructive"
      });
      return;
    }

    if (!replyTextToPost || !replyTextToPost.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please enter a reply before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      await api.post(`/comments/${commentId}/replies`, {
        text: replyTextToPost,
        problem_id: problemId
      });

      // Clear the reply input and hide reply box
      setReplyText({ ...replyText, [commentId]: '' });
      setShowReplyBox({ ...showReplyBox, [commentId]: false });

      toast({
        title: "Reply Posted",
        description: "Your reply has been added to the comment."
      });
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      await api.delete(`/comments/${commentId}`);

      setProblem((prev: any) => prev ? { ...prev, discussions: prev.discussions - 1 } : prev);

      toast({
        title: "Comment Deleted",
        description: "Your comment and its replies have been deleted."
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete your comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] flex-col gap-4 px-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h1 className="text-xl md:text-2xl font-bold text-center">{error}</h1>
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-5xl">
      <Card className="mb-6 md:mb-8 shadow-sm">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl sm:text-2xl font-bold break-words text-foreground">{problem.title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm flex flex-wrap items-center gap-1 sm:gap-2">
              <span>Posted {problem.createdAt}</span>
              <span className="hidden xs:inline">•</span>
              <span>{problem.votes} votes</span>
              <span className="hidden xs:inline">•</span>
              <span>{problem.discussions} comments</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-5">
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-sm sm:text-base text-foreground">Description</h3>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
              {problem.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm sm:text-base font-medium">Impacts</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <ul className="list-disc pl-5 space-y-1 sm:space-y-2 text-sm sm:text-base">
                  {problem.impacts && problem.impacts.map((impact: any, index: number) => (
                    <li key={index} className="text-muted-foreground">{impact}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 bg-secondary/50">
                <CardTitle className="text-sm sm:text-base font-medium">Challenges</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 mt-2">
                <ul className="list-disc pl-5 space-y-1 sm:space-y-2 text-sm sm:text-base">
                  {problem.challenges && problem.challenges.map((challenge: any, index: number) => (
                    <li key={index} className="text-muted-foreground">{challenge}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant={userVotes.problem ? "default" : "outline"}
              className={`flex items-center gap-2 text-sm ${userVotes.problem ? 'shadow-md shadow-primary/20' : 'hover:bg-primary/10'}`}
              onClick={handleVoteProblem}
              size="sm"
            >
              <ThumbsUp className={`h-4 w-4 ${userVotes.problem ? 'fill-primary-foreground' : ''}`} />
              <span className="hidden xs:inline">{userVotes.problem ? "Upvoted" : "Upvote"}</span>
            </Button>

            {problem.difficulty && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.medium}`}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </span>
            )}

            {currentUser ? (
              // User is logged in - show submit solution button
              // Check if user's rank meets the problem's minimum rank requirement
              (() => {
                const userRank = currentUser.rank || 'F';
                const minRank = problem.minRankRequired || 'F';
                const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
                const userRankIndex = rankOrder.indexOf(userRank);
                const minRankIndex = rankOrder.indexOf(minRank);
                const canSubmit = userRankIndex >= minRankIndex;

                if (canSubmit) {
                  return (
                    <Button
                      variant="default"
                      className="flex items-center gap-2 text-sm shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                      onClick={() => router.push(`/problems/${problemId}/submit-solution`)}
                      size="sm"
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span className="hidden xs:inline">Submit Solution</span>
                    </Button>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Rank {minRank}+ required
                    </span>
                  );
                }
              })()
            ) : (
              // User is not logged in - show login prompt
              <Button
                variant="outline"
                className="flex items-center gap-2 text-sm hover:bg-primary/10 transition-colors"
                onClick={() => router.push(`/login?redirect=/problems/${problemId}`)}
                size="sm"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="hidden xs:inline">Log in to Submit</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Discussion and Solutions */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 md:mb-8">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="discussion" className="text-sm">Discussion ({problem.discussions})</TabsTrigger>
          <TabsTrigger value="solutions" className="text-sm">Proposed Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="discussion">
          {/* Add Comment */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="py-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">Join the Discussion</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Share your thoughts, questions, or insights about this problem.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5">
              <form onSubmit={handleSubmitComment}>
                <Textarea
                  placeholder="Write your comment here..."
                  className="min-h-20 md:min-h-24 mb-4 text-sm sm:text-base"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser}
                />
                {!currentUser && (
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mb-4">
                    Please log in to join the discussion.
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!currentUser || !commentText.trim()}
                    size="sm"
                    className="text-xs sm:text-sm shadow-md shadow-primary/20"
                  >
                    Post Comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-4 sm:space-y-6">
            {loadingComments ? (
              <div className="flex justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 sm:py-8 text-center text-slate-500 text-sm sm:text-base">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Map through comments and render them */}
                {comments.map(comment => (
                  <Card key={comment.id} className="mb-3 sm:mb-4 shadow-sm">
                    <CardHeader className="py-3 px-4 sm:px-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                            <AvatarImage src={comment.authorPhotoUrl} />
                            <AvatarFallback>{comment.authorName?.charAt(0) || 'A'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm sm:text-base">{comment.authorName}</p>
                              {comment.authorRank && (
                                <RankBadge rank={comment.authorRank} size="sm" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{comment.createdAt}</span>
                              {comment.authorPoints && comment.authorPoints > 0 && (
                                <span>• {comment.authorPoints} pts</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {currentUser && comment.authorId === currentUser.uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs p-1 sm:p-2 transition-colors"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-2 pb-4">
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{comment.body}</p>

                      {/* Reply button and comments */}
                      <div className="mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs sm:text-sm p-1 sm:p-2 h-auto transition-colors"
                            onClick={() => setShowReplyBox({
                              ...showReplyBox,
                              [comment.id]: !showReplyBox[comment.id]
                            })}
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Reply
                          </Button>
                        </div>

                        {/* Reply form */}
                        {showReplyBox[comment.id] && (
                          <div className="mt-3 sm:mt-4 pl-3 sm:pl-6 border-l-2 border-slate-200">
                            <Textarea
                              placeholder="Write your reply..."
                              className="min-h-16 sm:min-h-20 mb-2 text-sm bg-background"
                              value={replyText[comment.id] || ''}
                              onChange={(e) => setReplyText({
                                ...replyText,
                                [comment.id]: e.target.value
                              })}
                              disabled={!currentUser}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(comment.id, replyText[comment.id])}
                              disabled={!currentUser || !replyText[comment.id]?.trim()}
                              className="text-xs"
                            >
                              Post Reply
                            </Button>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 sm:mt-4 pl-3 sm:pl-6 border-l-2 border-slate-200 space-y-3 sm:space-y-4">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="pb-1 sm:pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                                    <AvatarImage src={reply.authorPhotoUrl} />
                                    <AvatarFallback>{reply.authorName?.charAt(0) || 'A'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs sm:text-sm">{reply.authorName}</span>
                                    {reply.authorRank && (
                                      <RankBadge rank={reply.authorRank} size="sm" />
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500">{reply.createdAt}</span>
                                </div>
                                <p className="text-xs sm:text-sm whitespace-pre-wrap">{reply.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="solutions">
          {/* Filter buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={solutionFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSolutionFilter('all')}
              className={`text-xs ${solutionFilter !== 'all' ? 'hover:bg-primary/10' : ''}`}
            >
              All ({solutions.length})
            </Button>
            <Button
              variant={solutionFilter === 'accepted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSolutionFilter('accepted')}
              className={`text-xs ${solutionFilter !== 'accepted' ? 'hover:bg-primary/10' : ''}`}
            >
              Accepted ({solutions.filter(s => s.status === 'accepted').length})
            </Button>
            <Button
              variant={solutionFilter === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSolutionFilter('recommended')}
              className={`text-xs ${solutionFilter !== 'recommended' ? 'hover:bg-primary/10' : ''}`}
            >
              Recommended ({solutions.filter(s => s.status === 'recommended').length})
            </Button>
          </div>

          {loadingSolutions ? (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : solutionsError ? (
            <div className="py-6 sm:py-8 text-center text-red-500 text-sm sm:text-base">
              {solutionsError}
            </div>
          ) : solutions.length === 0 ? (
            <div className="py-6 sm:py-8 text-center text-slate-500 text-sm sm:text-base">
              No solutions have been submitted yet. Be the first to propose a solution!
            </div>
          ) : (() => {
            const filteredSolutions = solutionFilter === 'all'
              ? solutions
              : solutions.filter(s => s.status === solutionFilter);

            if (filteredSolutions.length === 0) {
              return (
                <div className="py-6 sm:py-8 text-center text-slate-500 text-sm sm:text-base">
                  No {solutionFilter === 'accepted' ? 'accepted' : solutionFilter === 'recommended' ? 'recommended' : ''} solutions found.
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredSolutions.map(solution => (
                  <Card key={solution.id} className="shadow-sm">
                    <CardHeader className="py-3 px-4 sm:px-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                            <AvatarImage src={solution.authorPhotoUrl} />
                            <AvatarFallback>{solution.authorName?.charAt(0) || 'A'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{solution.authorName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              {solution.authorRank && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${solution.authorRank === 'S' ? 'bg-purple-100 text-purple-800' :
                                  solution.authorRank === 'A' ? 'bg-red-100 text-red-800' :
                                    solution.authorRank === 'B' ? 'bg-orange-100 text-orange-800' :
                                      solution.authorRank === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                        solution.authorRank === 'D' ? 'bg-green-100 text-green-800' :
                                          solution.authorRank === 'E' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                  }`}>
                                  {solution.authorRank}
                                </span>
                              )}
                              {solution.authorPoints > 0 && <span>• {solution.authorPoints} pts</span>}
                              <span>• {solution.createdAt || 'recently'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            style={{ cursor: 'pointer' }}
                            variant={solution.hasVoted || userVotedSolutions.has(solution.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVoteSolution(solution.id)}
                            disabled={actionLoading === solution.id}
                            className="flex items-center gap-1 text-xs"
                          >
                            <ThumbsUp className={`h-3 w-3 ${solution.hasVoted || userVotedSolutions.has(solution.id) ? 'fill-white' : ''}`} />
                            <span>{solution.votesCount || 0}</span>
                          </Button>
                          {solution.status === 'accepted' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          )}
                          {solution.status === 'recommended' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4">
                      <h3 className="font-semibold text-base sm:text-lg mb-2">{solution.title}</h3>
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-4">
                        {solution.description}
                      </p>

                      {solution.implementationApproach && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-1">Implementation Approach</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                            {solution.implementationApproach}
                          </p>
                        </div>
                      )}

                      {solution.resourcesNeeded && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-1">Resources Needed</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                            {solution.resourcesNeeded}
                          </p>
                        </div>
                      )}

                      {solution.estimatedTimeline && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-1">Estimated Timeline</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {solution.estimatedTimeline}
                          </p>
                        </div>
                      )}

                      {solution.attachments && solution.attachments.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Attachments</h4>
                          <div className="flex flex-wrap gap-2">
                            {solution.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-muted hover:bg-muted/80"
                              >
                                🔗 {att.caption || att.url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {isProblemOwner && (
                        <div className="mt-4 pt-4 border-t flex gap-2">
                          {solution.status !== 'accepted' ? (
                            <Button
                              style={{ cursor: 'pointer' }}
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptSolution(solution.id)}
                              disabled={actionLoading === solution.id}
                              className="text-xs"
                            >
                              {actionLoading === solution.id ? 'Accepting...' : '✓ Accept Solution'}
                            </Button>
                          ) : (
                            <Button
                              style={{ cursor: 'pointer' }}
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-xs cursor-default"
                            >
                              ✓ Accepted
                            </Button>
                          )}

                          {solution.status !== 'accepted' && solution.status !== 'recommended' && (
                            <Button
                              style={{ cursor: 'pointer' }}
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecommendSolution(solution.id)}
                              disabled={actionLoading === solution.id}
                              className="text-xs"
                            >
                              {actionLoading === solution.id ? 'Recommending...' : '★ Recommend'}
                            </Button>
                          )}

                          {solution.status === 'recommended' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ★ Recommended
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Submit Solution CTA */}
          {solutions.length > 0 && currentUser && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/problems/${problemId}/submit-solution`)}
              >
                Submit Your Solution
              </Button>
            </div>
          )}

          {!currentUser && solutions.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Want to contribute a solution?
              </p>
              <Button variant="outline" onClick={() => router.push(`/login?redirect=/problems/${problemId}`)}>
                Log in to Submit
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}