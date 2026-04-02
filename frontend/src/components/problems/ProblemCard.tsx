import Link from 'next/link';
import { ReactNode } from 'react';
import type { Problem } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquare, Clock, Calendar, ThumbsUp, Lightbulb } from 'lucide-react';

export interface ProblemCardProps {
    problem: Problem;
    href?: string;
    layout?: 'grid' | 'list';
    footerActions?: ReactNode;
    showCreatedAtDate?: boolean;
    showViewButton?: boolean;
}

export default function ProblemCard({
    problem,
    href,
    layout = 'grid',
    footerActions,
    showCreatedAtDate = false,
    showViewButton = true
}: ProblemCardProps) {
    const problemHref = href || `/problems/${problem.id}`;

    if (layout === 'list') {
        return (
            <Link href={problemHref} className="block no-underline h-full">
                <Card className="cursor-pointer transition-all duration-300 h-full border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 bg-background/50 backdrop-blur-sm flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                    <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 backdrop-blur-md">
                                {problem.category}
                            </Badge>
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.votes || 0}
                            </div>
                        </div>
                        <CardTitle className="mt-2 sm:mt-3 text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {problem.title}
                        </CardTitle>
                        <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2 text-muted-foreground/80">
                            {problem.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 px-3 sm:px-6 flex-grow relative z-10">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            {problem.tags && problem.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-background/50 backdrop-blur-sm border-border/50">
                                    {tag}
                                </Badge>
                            ))}
                            {problem.tags && problem.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm border-border/50">
                                    +{problem.tags.length - 3} more
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border pt-3 px-3 sm:px-6 mt-auto text-xs sm:text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <div className="flex items-center mr-3 sm:mr-4">
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.discussions || 0}
                            </div>
                            {problem.solutionCount !== undefined && problem.solutionCount > 0 && (
                                <div className="flex items-center mr-3 sm:mr-4">
                                    <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-amber-500 dark:text-amber-400" /> {problem.solutionCount}
                                </div>
                            )}
                            <div className="flex items-center">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.createdAt || 'Recently'}
                            </div>
                        </div>
                        {footerActions ? footerActions : (
                            showViewButton && (
                                <Button variant="ghost" size="sm" className="text-primary text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    View
                                </Button>
                            )
                        )}
                    </CardFooter>
                </Card>
            </Link>
        );
    }

    // Default Grid Layout
    return (
        <Card className="cursor-pointer transition-all duration-300 border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 bg-background/50 backdrop-blur-sm flex flex-col h-full group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
            <div className="flex flex-col p-3 sm:p-4 h-full relative z-10">
                <div className="flex flex-row items-start justify-between mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 backdrop-blur-md">
                        {problem.category}
                    </Badge>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        {showCreatedAtDate ? (
                            <><Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.createdAt}</>
                        ) : (
                            <><ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.votes || 0}</>
                        )}
                    </div>
                </div>

                <Link href={problemHref} className="block no-underline flex-grow mt-2">
                    <h3 className="text-lg font-semibold mb-1 sm:mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {problem.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground/80 mb-2 sm:mb-3 line-clamp-2">
                        {problem.description}
                    </p>
                </Link>

                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                    {problem.tags && problem.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-background/50 backdrop-blur-sm border-border/50">
                            {tag}
                        </Badge>
                    ))}
                    {problem.tags && problem.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm border-border/50">
                            +{problem.tags.length - 3} more
                        </Badge>
                    )}
                </div>

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-border">
                    {footerActions ? footerActions : (
                        <>
                            <div className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm text-muted-foreground">
                                {showCreatedAtDate && (
                                    <div className="flex items-center">
                                        <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.votes || 0}
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> {problem.discussions || 0}
                                </div>
                                {problem.solutionCount !== undefined && problem.solutionCount > 0 && (
                                    <div className="flex items-center">
                                        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-amber-500 dark:text-amber-400" /> {problem.solutionCount}
                                    </div>
                                )}
                            </div>

                            {showViewButton && (
                                <Link href={problemHref}>
                                    <Button size="sm" variant="ghost" className="text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 h-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                        View
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
