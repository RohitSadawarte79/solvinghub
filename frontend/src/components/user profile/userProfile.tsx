"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RankBadge } from "@/components/ui/rank-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { api, getUserFromToken } from "@/lib/api";

import {
    Target,
    CheckCircle,
    Activity,
    Github,
    Calendar,
    Loader2
} from "lucide-react";
import { toast } from "@/lib/toast-wrapper";

interface UserProfileProps {
    userId?: string; // If undefined, fetch current user
}

export default function UserProfile({ userId }: UserProfileProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const currentUser = getUserFromToken();

    const [editName, setEditName] = useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Determine which user to fetch
        const fetchUser = async () => {
            setLoading(true);
            try {
                const targetUserId = userId || currentUser?.uid;
                if (!targetUserId) {
                    router.push("/signup");
                    return;
                }

                // Fetch real user data; if it fails, it throws to the catch block instead of faking data
                const userData = await api.get<any>(`/users/${targetUserId}`);

                setUser({
                    ...userData,
                    joinedFormatted: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Recently"
                });

                if (targetUserId === currentUser?.uid) {
                    setEditName(userData.displayName || "");
                    setEditPhotoUrl(userData.photoURL || "");
                }
            } catch (err) {
                toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, currentUser?.uid, router]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/users/${user.id}`, {
                displayName: editName,
                photoURL: editPhotoUrl
            });
            setUser({ ...user, displayName: editName, photoURL: editPhotoUrl });
            toast({ title: "Profile Updated", description: "Your profile has been saved." });
            setIsSheetOpen(false);
        } catch (err) {
            toast({ title: "Update Failed", description: "Could not save your profile.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold mb-2">User not found</h2>
                <p className="text-muted-foreground">The profile you are looking for does not exist or requires login.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* 1. Core Identity & Gamification */}
            <Card className="mb-8 border-none shadow-md overflow-hidden relative">
                <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 absolute top-0 left-0"></div>
                <CardContent className="pt-16 pb-6 relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="text-4xl">{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold">{user.displayName}</h1>
                            <RankBadge rank={user.rank} size="lg" />
                        </div>

                        <p className="text-muted-foreground max-w-lg">{user.bio}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" /> Joined {user.joinedFormatted}
                            </div>
                            {user.github && (
                                <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                                    <Github className="h-4 w-4" /> {user.github}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main User CTA */}
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 ml-auto shrink-0 mt-4 md:mt-0">
                        <div className="bg-secondary/50 rounded-lg p-3 text-center px-6">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Hub Score</p>
                            <p className="text-2xl font-black text-primary">{user.points}</p>
                        </div>
                        {currentUser?.uid === user.id && (
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full h-full md:h-auto">Edit Profile</Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Edit Profile</SheetTitle>
                                        <SheetDescription>
                                            Make changes to your profile here. Click save when you&apos;re done.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <form onSubmit={handleProfileUpdate} className="space-y-6 mt-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Display Name</label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                required
                                                minLength={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Photo URL</label>
                                            <Input
                                                value={editPhotoUrl}
                                                onChange={(e) => setEditPhotoUrl(e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                            />
                                            <p className="text-xs text-muted-foreground">Provide a direct link to an image.</p>
                                        </div>
                                        <Button type="submit" disabled={isSaving} className="w-full mt-4">
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </form>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Problems Solved</CardTitle>
                        <Target className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{user.problems_solved}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Solutions Accepted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{user.solutions_accepted}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributions</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{user.total_contributions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Posts, votes & comments</p>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Engagement & History Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-6 h-auto p-1 bg-secondary/30">
                    <TabsTrigger value="overview" className="px-6 py-2.5">Overview</TabsTrigger>
                    <TabsTrigger value="problems" className="px-6 py-2.5">Authored Problems</TabsTrigger>
                    <TabsTrigger value="solutions" className="px-6 py-2.5">Top Solutions</TabsTrigger>
                    <TabsTrigger value="discussions" className="px-6 py-2.5">Discussions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Recently viewed problems and progression.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user.recent_activity && user.recent_activity.length > 0 ? (
                                <div className="space-y-4">
                                    {user.recent_activity.map((activity: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-4 border border-border/50 rounded-lg hover:bg-secondary/40 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{activity.problemName}</p>
                                                <p className="text-xs text-muted-foreground uppercase opacity-80 mt-1">{activity.category}</p>
                                            </div>
                                            <p className="text-xs font-medium text-slate-400">
                                                {new Date(activity.viewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                                    <Activity className="h-12 w-12 text-slate-300 mb-4" />
                                    <p>Activity timeline will appear here.</p>
                                    <p className="text-sm max-w-sm mt-2">View problems or log interactions to start building your interactive timeline!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="problems">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Authored Problems</CardTitle>
                            <CardDescription>Problems posted by {user.displayName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-slate-500">
                                No problems authored yet.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="solutions">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Top Solutions</CardTitle>
                            <CardDescription>Highest rated and accepted solutions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-slate-500">
                                No solutions submitted yet.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discussions">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Discussions</CardTitle>
                            <CardDescription>Comments and replies.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-slate-500">
                                No discussions participated in yet.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
