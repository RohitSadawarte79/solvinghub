"use client"

import { useState } from 'react';
import type { Solution, Problem, Attachment } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    X, 
    AlertCircle, 
    Image, 
    Video, 
    FileText, 
    Link as LinkIcon,
    Trash2,
    Lightbulb,
    Loader2
} from 'lucide-react';

interface SolutionFormProps {
    problem: Problem;
    onSubmit: (formData: Partial<Solution>) => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}

const TIMELINE_OPTIONS = [
    { value: '1_week', label: '1 Week' },
    { value: '2_weeks', label: '2 Weeks' },
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months+' }
];

export default function SolutionForm({
    problem,
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitLabel = "Submit Solution"
}: SolutionFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [implementationApproach, setImplementationApproach] = useState('');
    const [resourcesNeeded, setResourcesNeeded] = useState('');
    const [estimatedTimeline, setEstimatedTimeline] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkCaption, setNewLinkCaption] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    const [activeView, setActiveView] = useState('edit');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!title.trim()) newErrors.title = "Title is required";
        else if (title.length < 10) newErrors.title = "Title should be at least 10 characters";

        if (!description.trim()) newErrors.description = "Description is required";
        else if (description.length < 100) newErrors.description = "Description should be at least 100 characters";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            setActiveView('edit');
            return;
        }

        setErrors({});
        const formData: Partial<Solution> = {
            problemId: problem.id || '',
            title,
            description,
            implementationApproach: implementationApproach || undefined,
            resourcesNeeded: resourcesNeeded || undefined,
            estimatedTimeline: estimatedTimeline || undefined,
            attachments: attachments.filter(a => a.url.trim() !== '')
        };

        onSubmit(formData);
    };

    const handleAddLink = () => {
        if (!newLinkUrl.trim()) return;
        
        const newAttachment: Attachment = {
            id: `link-${Date.now()}`,
            type: 'link',
            url: newLinkUrl,
            caption: newLinkCaption || undefined,
            order: attachments.length
        };
        
        setAttachments([...attachments, newAttachment]);
        setNewLinkUrl('');
        setNewLinkCaption('');
        setShowLinkInput(false);
    };

    const handleRemoveAttachment = (id: string) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    const toggleView = (view: string) => {
        if (view === 'preview') validateForm();
        setActiveView(view);
    };

    const renderErrorMessage = (fieldName: string) => {
        return errors[fieldName] ? (
            <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors[fieldName]}
            </p>
        ) : null;
    };

    return (
        <div className="space-y-6">
            {/* Problem Summary */}
            <Card className="bg-muted/50 border-2 border-dashed">
                <CardHeader className="py-4">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Problem You&apos;re Solving</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="py-2">
                    <p className="font-medium text-lg">{problem.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {problem.description}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline">{problem.category}</Badge>
                        <Badge variant="secondary" className="capitalize">
                            {problem.difficulty || 'Medium'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={activeView} onValueChange={toggleView} className="w-full">
                <div className="flex justify-end mb-2">
                    <TabsList>
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="preview" className="mt-0">
                    <Card className="border-2 border-primary/50">
                        <CardHeader>
                            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary mb-2">
                                Solution Proposal
                            </Badge>
                            <CardTitle className="mt-3">{title || "Untitled Solution"}</CardTitle>
                            <CardDescription className="mt-2 whitespace-pre-wrap">
                                {description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attachments.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium mb-3">Attachments</h3>
                                    <div className="space-y-2">
                                        {attachments.map((att) => (
                                            <div key={att.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                                                {att.type === 'link' ? (
                                                    <LinkIcon className="h-4 w-4" />
                                                ) : att.type === 'image' ? (
                                                    <Image className="h-4 w-4" />
                                                ) : (
                                                    <FileText className="h-4 w-4" />
                                                )}
                                                <span className="text-sm truncate">{att.caption || att.url}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {implementationApproach && (
                                    <Card>
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-sm font-medium">Implementation Approach</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2">
                                            <p className="text-sm whitespace-pre-wrap">{implementationApproach}</p>
                                        </CardContent>
                                    </Card>
                                )}
                                {resourcesNeeded && (
                                    <Card>
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-sm font-medium">Resources Needed</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2">
                                            <p className="text-sm whitespace-pre-wrap">{resourcesNeeded}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {estimatedTimeline && (
                                <div className="mt-4">
                                    <span className="text-sm font-medium">Estimated Timeline: </span>
                                    <span className="text-sm text-muted-foreground">
                                        {TIMELINE_OPTIONS.find(t => t.value === estimatedTimeline)?.label || estimatedTimeline}
                                    </span>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="border-t border-border pt-4 flex justify-between">
                            <Button variant="outline" type="button" onClick={() => toggleView('edit')}>
                                Return to Edit
                            </Button>
                            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    submitLabel
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="edit" className="mt-0">
                    <Card>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <CardHeader>
                                <CardTitle>Your Solution</CardTitle>
                                <CardDescription>
                                    Describe your solution to this problem. Be as detailed as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Solution Title</label>
                                    <Input
                                        placeholder="e.g., AI-Powered Waste Sorting System"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={errors.title ? 'border-destructive' : ''}
                                    />
                                    {renderErrorMessage('title')}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Detailed Description</label>
                                    <Textarea
                                        placeholder="Explain your solution in detail. How does it work? What makes it unique? Why is it better than existing approaches?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className={`min-h-[12rem] ${errors.description ? 'border-destructive' : ''}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum 100 characters. You can describe your approach, key features, and expected outcomes.
                                    </p>
                                    {renderErrorMessage('description')}
                                </div>

                                {/* Attachments Section */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Attachments (Optional)</label>
                                    
                                    {/* Attachment List */}
                                    {attachments.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {attachments.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        {att.type === 'link' ? (
                                                            <LinkIcon className="h-5 w-5 text-blue-500" />
                                                        ) : att.type === 'image' ? (
                                                            <Image className="h-5 w-5 text-green-500" />
                                                        ) : att.type === 'video' ? (
                                                            <Video className="h-5 w-5 text-purple-500" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-orange-500" />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium truncate max-w-[200px]">
                                                                {att.caption || att.url}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground capitalize">{att.type}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveAttachment(att.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Link Input */}
                                    {showLinkInput ? (
                                        <div className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    placeholder="https://example.com"
                                                    value={newLinkUrl}
                                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Caption (optional)"
                                                    value={newLinkCaption}
                                                    onChange={(e) => setNewLinkCaption(e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm" onClick={handleAddLink}>
                                                Add
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setShowLinkInput(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => setShowLinkInput(true)}
                                            className="w-full justify-start"
                                        >
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            Add Link
                                        </Button>
                                    )}

                                    {/* File Upload Placeholder - Coming Soon */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            disabled
                                            className="opacity-50 cursor-not-allowed"
                                            title="Coming soon"
                                        >
                                            <Image className="h-4 w-4 mr-2" />
                                            Image
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            disabled
                                            className="opacity-50 cursor-not-allowed"
                                            title="Coming soon"
                                        >
                                            <Video className="h-4 w-4 mr-2" />
                                            Video
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            disabled
                                            className="opacity-50 cursor-not-allowed"
                                            title="Coming soon"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Document
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Image, video, and document upload coming soon. Currently you can add links.
                                    </p>
                                </div>

                                {/* Implementation Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Implementation Approach (Optional)</label>
                                        <Textarea
                                            placeholder="How would you implement this solution?"
                                            value={implementationApproach}
                                            onChange={(e) => setImplementationApproach(e.target.value)}
                                            className="min-h-[6rem]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Resources Needed (Optional)</label>
                                        <Textarea
                                            placeholder="What resources would be required?"
                                            value={resourcesNeeded}
                                            onChange={(e) => setResourcesNeeded(e.target.value)}
                                            className="min-h-[6rem]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Estimated Timeline (Optional)</label>
                                    <Select value={estimatedTimeline} onValueChange={setEstimatedTimeline}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="Select timeline" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIMELINE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t border-border pt-6">
                                {onCancel ? (
                                    <Button variant="outline" type="button" onClick={onCancel}>
                                        Cancel
                                    </Button>
                                ) : <div />}

                                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        submitLabel
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}