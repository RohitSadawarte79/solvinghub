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
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";

// Firebase imports
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  increment,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  const [userVotes, setUserVotes] = useState({
    problem: false,
    comments: {}
  });

  // Get the problem ID from the params
  const problemId = params?.id;

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch user's votes
        fetchUserVotes(user.uid);
      }
    });

    return () => unsubscribe();
  }, [problemId]); // Add problemId as dependency

  // Fetch user's votes
  const fetchUserVotes = async (userId) => {
    try {
      // Check if user has voted on the problem
      const problemVoteRef = collection(db, "votes");
      const problemVoteQuery = query(
        problemVoteRef, 
        where("userId", "==", userId), 
        where("problemId", "==", problemId)
      );
      const problemVoteSnapshot = await getDocs(problemVoteQuery);
      const hasVotedOnProblem = !problemVoteSnapshot.empty;
      
      // Check which comments the user has voted on
      const commentVotesRef = collection(db, "commentVotes");
      const commentVotesQuery = query(
        commentVotesRef, 
        where("userId", "==", userId), 
        where("problemId", "==", problemId)
      );
      const commentVotesSnapshot = await getDocs(commentVotesQuery);
      
      const commentVotesData = {};
      commentVotesSnapshot.forEach(doc => {
        const data = doc.data();
        commentVotesData[data.commentId] = true;
      });
      
      setUserVotes({
        problem: hasVotedOnProblem,
        comments: commentVotesData
      });
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  // Fetch problem details
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const problemRef = doc(db, "problems", problemId);
        const problemSnap = await getDoc(problemRef);
        
        if (problemSnap.exists()) {
          const problemData = {
            id: problemSnap.id,
            ...problemSnap.data(),
            // Convert Firebase Timestamp to relative time string
            createdAt: calculateTimeAgo(problemSnap.data().timestamp?.toDate())
          };
          setProblem(problemData);
        } else {
          setError("Problem not found");
        }
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

  // Fetch and subscribe to comments
  useEffect(() => {
    if (!problemId) return;
    
    setLoadingComments(true);
    
    // Create a query for comments
    const commentsRef = collection(db, "comments");
    const commentsQuery = query(
      commentsRef, 
      where("problemId", "==", problemId),
      orderBy("timestamp", "desc")
    );
    
    // Setup real-time listener for comments
    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      try {
        // Get comments
        const commentsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const comment = {
              id: doc.id,
              ...doc.data(),
              createdAt: calculateTimeAgo(doc.data().timestamp?.toDate())
            };
            
            // Fetch replies for this comment
            const repliesRef = collection(db, "replies");
            const repliesQuery = query(
              repliesRef, 
              where("commentId", "==", doc.id), 
              orderBy("timestamp", "asc")
            );
            const repliesSnapshot = await getDocs(repliesQuery);
            
            // Add replies to the comment
            comment.replies = repliesSnapshot.docs.map(replyDoc => ({
              id: replyDoc.id,
              ...replyDoc.data(),
              createdAt: calculateTimeAgo(replyDoc.data().timestamp?.toDate())
            }));
            
            return comment;
          })
        );
        
        setComments(commentsData);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoadingComments(false);
      }
    }, (error) => {
      console.error("Error in comments listener:", error);
      setLoadingComments(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [problemId]);

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

  // Handle problem upvote
  const handleVoteProblem = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on problems.",
        variant: "destructive"
      });
      router.push('/login?redirect=/problems/' + problemId);
      return;
    }
    
    try {
      const userId = auth.currentUser.uid;
      
      // Check if user has already voted
      if (userVotes.problem) {
        // Remove vote
        const votesRef = collection(db, "votes");
        const voteQuery = query(
          votesRef, 
          where("userId", "==", userId), 
          where("problemId", "==", problemId)
        );
        
        const voteSnapshot = await getDocs(voteQuery);
        
        if (!voteSnapshot.empty) {
          // Delete vote document
          await deleteDoc(voteSnapshot.docs[0].ref);
          
          // Update problem vote count
          const problemRef = doc(db, "problems", problemId);
          await updateDoc(problemRef, {
            votes: increment(-1)
          });
          
          // Update local state
          setProblem({ ...problem, votes: problem.votes - 1 });
          setUserVotes({ ...userVotes, problem: false });
          
          toast({
            title: "Vote Removed",
            description: "Your vote has been removed from this problem."
          });
        }
      } else {
        // Add vote
        await addDoc(collection(db, "votes"), {
          userId,
          problemId,
          timestamp: serverTimestamp()
        });
        
        // Update problem vote count
        const problemRef = doc(db, "problems", problemId);
        await updateDoc(problemRef, {
          votes: increment(1)
        });
        
        // Update local state
        setProblem({ ...problem, votes: problem.votes + 1 });
        setUserVotes({ ...userVotes, problem: true });
        
        toast({
          title: "Vote Added",
          description: "Your vote has been added to this problem."
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

  // Handle comment upvote
  const handleVoteComment = async (commentId) => {
    // Comment upvote handler implementation would go here
    console.log("Vote for comment:", commentId);
  };
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
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
      const newComment = {
        problemId,
        text: commentText,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        authorPhotoURL: auth.currentUser.photoURL || null,
        votes: 0,
        timestamp: serverTimestamp()
      };
      
      // Add comment to Firestore
      await addDoc(collection(db, "comments"), newComment);
      
      // Update problem discussions count
      const problemRef = doc(db, "problems", problemId);
      await updateDoc(problemRef, {
        discussions: increment(1)
      });
      
      // Update local state
      setProblem({ ...problem, discussions: problem.discussions + 1 });
      
      // Clear the comment input
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
  const handleReplySubmit = async (commentId, replyText) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply to comments.",
        variant: "destructive"
      });
      return;
    }
    
    if (!replyText || !replyText.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please enter a reply before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newReply = {
        commentId,
        problemId,
        text: replyText,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        authorPhotoURL: auth.currentUser.photoURL || null,
        timestamp: serverTimestamp()
      };
      
      // Add reply to Firestore
      await addDoc(collection(db, "replies"), newReply);
      
      // Clear the reply input and hide reply box
      setReplyText({...replyText, [commentId]: ''});
      setShowReplyBox({...showReplyBox, [commentId]: false});
      
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
  const handleDeleteComment = async (commentId) => {
    if (!auth.currentUser) {
      return;
    }
    
    try {
      // Get the comment to check if the current user is the author
      const commentRef = doc(db, "comments", commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        toast({
          title: "Error",
          description: "Comment not found.",
          variant: "destructive"
        });
        return;
      }
      
      const commentData = commentSnap.data();
      
      // Check if the current user is the author of the comment
      if (commentData.authorId !== auth.currentUser.uid) {
        toast({
          title: "Permission Denied",
          description: "You can only delete your own comments.",
          variant: "destructive"
        });
        return;
      }
      
      // Delete all replies to this comment
      const repliesRef = collection(db, "replies");
      const repliesQuery = query(repliesRef, where("commentId", "==", commentId));
      const repliesSnapshot = await getDocs(repliesQuery);
      // Create a batch
      const batch = writeBatch(db);
      
      // Add all reply deletions to the batch
      repliesSnapshot.forEach(replyDoc => {
        batch.delete(replyDoc.ref);
      });
      
      // Add comment deletion to the batch
      batch.delete(commentRef);
      
      // Commit the batch
      await batch.commit();
      
      // Update problem discussions count
      const problemRef = doc(db, "problems", problemId);
      await updateDoc(problemRef, {
        discussions: increment(-1)
      });
  
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] flex-col gap-4 px-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
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
            <CardTitle className="text-xl sm:text-2xl font-bold break-words">{problem.title}</CardTitle>
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
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Description</h3>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
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
                  {problem.impacts && problem.impacts.map((impact, index) => (
                    <li key={index} className="text-slate-700 dark:text-slate-200">{impact}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm sm:text-base font-medium">Challenges</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <ul className="list-disc pl-5 space-y-1 sm:space-y-2 text-sm sm:text-base">
                  {problem.challenges && problem.challenges.map((challenge, index) => (
                    <li key={index} className="text-slate-700 dark:text-slate-200">{challenge}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              style={{ cursor: 'pointer' }}
              variant={userVotes.problem ? "default" : "outline"}
              className="flex items-center gap-2 text-sm"
              onClick={handleVoteProblem}
              size="sm"
            >
              <ThumbsUp className={`h-4 w-4 ${userVotes.problem ? 'fill-white' : ''}`} />
              <span className="hidden xs:inline">{userVotes.problem ? "Upvoted" : "Upvote"}</span>
            </Button>
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
                  disabled={!auth.currentUser}
                />
                {!auth.currentUser && (
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mb-4">
                    Please log in to join the discussion.
                  </p>
                )}
                <div className="flex justify-end">
                  <Button 
                    style={{ cursor: 'pointer' }} 
                    type="submit" 
                    disabled={!auth.currentUser || !commentText.trim()}
                    size="sm"
                    className="text-xs sm:text-sm"
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
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
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
                            <AvatarImage src={comment.authorPhotoURL} />
                            <AvatarFallback>{comment.authorName?.charAt(0) || 'A'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{comment.authorName}</p>
                            <p className="text-xs text-slate-500">{comment.createdAt}</p>
                          </div>
                        </div>
                        {auth.currentUser && comment.authorId === auth.currentUser.uid && (
                          <Button 
                            style={{ cursor: 'pointer' }}
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs p-1 sm:p-2"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-2 pb-4">
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{comment.text}</p>
                      
                      {/* Reply button and comments */}
                      <div className="mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 mt-2">
                          <Button 
                            style={{ cursor: 'pointer' }}
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-500 text-xs sm:text-sm p-1 sm:p-2 h-auto"
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
                              className="min-h-16 sm:min-h-20 mb-2 text-sm"
                              value={replyText[comment.id] || ''}
                              onChange={(e) => setReplyText({
                                ...replyText,
                                [comment.id]: e.target.value
                              })}
                              disabled={!auth.currentUser}
                            />
                            <Button 
                              style={{ cursor: 'pointer' }}
                              size="sm"
                              onClick={() => handleReplySubmit(comment.id, replyText[comment.id])}
                              disabled={!auth.currentUser || !replyText[comment.id]?.trim()}
                              className="text-xs"
                            >
                              Post Reply
                            </Button>
                          </div>
                        )}
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 sm:mt-4 pl-3 sm:pl-6 border-l-2 border-slate-200 space-y-3 sm:space-y-4">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="pb-1 sm:pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                                    <AvatarImage src={reply.authorPhotoURL} />
                                    <AvatarFallback>{reply.authorName?.charAt(0) || 'A'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-xs sm:text-sm">{reply.authorName}</span>
                                  <span className="text-xs text-slate-500">{reply.createdAt}</span>
                                </div>
                                <p className="text-xs sm:text-sm whitespace-pre-wrap">{reply.text}</p>
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
          <div className="py-6 sm:py-8 text-center text-slate-500 text-sm sm:text-base">
            Solutions feature coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}