import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { CATEGORIES, DIFFICULTIES } from '@/lib/constants';
import type { Problem, ProblemDifficulty } from '@/types';
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
import { Plus, X, AlertCircle, MinusCircle, PlusCircle } from 'lucide-react';

// Wrap standard shadcn form elements (if they were using rhf, but here they are just divs)
const FormItem = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>;
const FormLabel = ({ children, className, htmlFor }: { children: React.ReactNode, className?: string, htmlFor?: string }) => <label htmlFor={htmlFor} className={`block text-sm font-medium ${className}`}>{children}</label>;
const FormControl = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const FormDescription = ({ children }: { children: React.ReactNode }) => <p className="text-[0.8rem] text-muted-foreground">{children}</p>;

export interface ProblemFormProps {
    initialData?: Partial<Problem>;
    onSubmit: (formData: Partial<Problem>) => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
    onHasChanges?: (hasChanges: boolean) => void;
}

export default function ProblemForm({
    initialData = {},
    onSubmit,
    onCancel,
    isSubmitting = false,
    submitLabel = "Submit",
    onHasChanges
}: ProblemFormProps) {
    const [title, setTitle] = useState(initialData.title || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [category, setCategory] = useState(initialData.category || '');
    const [difficulty, setDifficulty] = useState<ProblemDifficulty>(initialData.difficulty || 'medium');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState(initialData.tags || []);
    const [impacts, setImpacts] = useState(initialData.impacts?.length ? initialData.impacts : ['']);
    const [challenges, setChallenges] = useState(initialData.challenges?.length ? initialData.challenges : ['']);

    const [activeView, setActiveView] = useState('edit'); // 'edit' or 'preview'
    const [errors, setErrors] = useState<Record<string, string>>({});

    const categories = CATEGORIES;
    const difficulties = DIFFICULTIES;

    useEffect(() => {
        // Notify parent if changes were made
        if (onHasChanges) {
            const hasContent = Boolean(
                title ||
                description ||
                category ||
                difficulty ||
                tags.length > 0 ||
                impacts.some(i => i) ||
                challenges.some(c => c)
            );
            onHasChanges(hasContent);
        }
    }, [title, description, category, difficulty, tags, impacts, challenges, onHasChanges]);

    const handleAddTag = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const trimmedInput = tagInput.trim();
        if (trimmedInput !== '' && !tags.includes(trimmedInput) && tags.length < 5) {
            setTags([...tags, trimmedInput]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleAddImpact = () => {
        if (impacts.length < 5) setImpacts([...impacts, '']);
    };

    const handleRemoveImpact = (index: number) => {
        const newImpacts = [...impacts];
        newImpacts.splice(index, 1);
        setImpacts(newImpacts);
    };

    const handleImpactChange = (index: number, value: string) => {
        const newImpacts = [...impacts];
        newImpacts[index] = value;
        setImpacts(newImpacts);
    };

    const handleAddChallenge = () => {
        if (challenges.length < 5) setChallenges([...challenges, '']);
    };

    const handleRemoveChallenge = (index: number) => {
        const newChallenges = [...challenges];
        newChallenges.splice(index, 1);
        setChallenges(newChallenges);
    };

    const handleChallengeChange = (index: number, value: string) => {
        const newChallenges = [...challenges];
        newChallenges[index] = value;
        setChallenges(newChallenges);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!title.trim()) newErrors.title = "Title is required";
        else if (title.length < 10) newErrors.title = "Title should be at least 10 characters";

        if (!description.trim()) newErrors.description = "Description is required";
        else if (description.length < 50) newErrors.description = "Description should be at least 50 characters";

        if (!category) newErrors.category = "Category is required";
        if (tags.length === 0) newErrors.tags = "At least one tag is required";

        const emptyImpacts = impacts.findIndex(impact => !impact.trim());
        if (emptyImpacts !== -1) newErrors.impacts = `Impact #${emptyImpacts + 1} cannot be empty`;

        const emptyChallenges = challenges.findIndex(challenge => !challenge.trim());
        if (emptyChallenges !== -1) newErrors.challenges = `Challenge #${emptyChallenges + 1} cannot be empty`;

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
        const formData: Partial<Problem> = {
            title,
            description,
            category,
            difficulty,
            tags,
            impacts: impacts.filter((i: string) => i.trim() !== ''),
            challenges: challenges.filter((c: string) => c.trim() !== '')
        };

        onSubmit(formData);
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
        <Tabs value={activeView} onValueChange={toggleView} className="w-full mb-6">
            <div className="flex justify-end mb-2">
                <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="preview" className="mt-0">
                <Card className="border-2 border-primary/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {category || "No Category Selected"}
                            </Badge>
                        </div>
                        <CardTitle className="mt-3">{title || "Untitled Problem"}</CardTitle>
                        <CardDescription className="mt-2 whitespace-pre-wrap">
                            {description || "No description provided."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <h3 className="text-sm font-medium mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.length > 0 ? (
                                    tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No tags added</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Key Impacts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {impacts.filter(i => i.trim()).length > 0 ? (
                                            impacts.filter(i => i.trim()).map((impact, index) => (
                                                <li key={index} className="text-sm text-muted-foreground">{impact}</li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">No impacts specified</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Challenges</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {challenges.filter(c => c.trim()).length > 0 ? (
                                            challenges.filter(c => c.trim()).map((challenge, index) => (
                                                <li key={index} className="text-sm text-muted-foreground">{challenge}</li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">No challenges specified</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>

                    <CardFooter className="border-t border-border pt-4 flex justify-between">
                        <Button variant="outline" type="button" onClick={() => toggleView('edit')}>
                            Return to Edit
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full" />
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
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Problem Details</CardTitle>
                            <CardDescription>
                                Provide clear and detailed information about the problem you&apos;re sharing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormItem className="space-y-2">
                                <FormLabel htmlFor="title" className="text-base font-medium">Title</FormLabel>
                                <FormDescription>Write a clear, concise title that summarizes the problem.</FormDescription>
                                <FormControl>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Inefficient waste management in urban areas"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={errors.title ? 'border-destructive' : ''}
                                    />
                                </FormControl>
                                {renderErrorMessage('title')}
                            </FormItem>

                            <FormItem className="space-y-2">
                                <FormLabel htmlFor="description" className="text-base font-medium">Description</FormLabel>
                                <FormDescription>Provide a detailed explanation of the problem, its context, and why it&apos;s important.</FormDescription>
                                <FormControl>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the problem in detail..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className={`min-h-[8rem] ${errors.description ? 'border-destructive' : ''}`}
                                    />
                                </FormControl>
                                {renderErrorMessage('description')}
                            </FormItem>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem className="space-y-2">
                                    <FormLabel htmlFor="category" className="text-base font-medium">Category</FormLabel>
                                    <FormDescription>Select the category that best fits your problem.</FormDescription>
                                    <FormControl>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    {renderErrorMessage('category')}
                                </FormItem>

                                <FormItem className="space-y-2">
                                    <FormLabel htmlFor="difficulty" className="text-base font-medium">Difficulty Level</FormLabel>
                                    <FormDescription>Sets the rank required to submit solutions.</FormDescription>
                                    <FormControl>
                                        <Select value={difficulty} onValueChange={(val) => setDifficulty(val as ProblemDifficulty)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {difficulties.map((diff) => (
                                                    <SelectItem key={diff.value} value={diff.value}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{diff.label}</span>
                                                            <span className="text-xs text-muted-foreground">{diff.description}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                </FormItem>
                            </div>

                            <FormItem className="space-y-2">
                                <FormLabel htmlFor="tags" className="text-base font-medium">Tags</FormLabel>
                                <FormDescription>Add up to 5 tags to help categorize the problem.</FormDescription>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex">
                                    <FormControl>
                                        <Input
                                            id="tags"
                                            placeholder="e.g., Sustainability"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            className={`rounded-r-none ${errors.tags ? 'border-destructive' : ''}`}
                                            disabled={tags.length >= 5}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTag(e);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="rounded-l-none"
                                        disabled={tags.length >= 5 || !tagInput.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {renderErrorMessage('tags')}
                                {tags.length >= 5 && (
                                    <p className="text-sm text-amber-500 mt-1">Maximum number of tags reached (5)</p>
                                )}
                            </FormItem>

                            <FormItem className="space-y-2">
                                <FormLabel className="text-base font-medium">Key Impacts</FormLabel>
                                <FormDescription>List the main impacts or consequences of this problem.</FormDescription>
                                <div className="space-y-3">
                                    {impacts.map((impact, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Environmental pollution affecting local communities"
                                                    value={impact}
                                                    onChange={(e) => handleImpactChange(index, e.target.value)}
                                                    className={errors.impacts && !impact.trim() ? 'border-destructive' : ''}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveImpact(index)}
                                                disabled={impacts.length <= 1}
                                                className={impacts.length <= 1 ? "invisible" : ""}
                                            >
                                                <MinusCircle className="h-5 w-5 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center mt-2"
                                        onClick={handleAddImpact}
                                        disabled={impacts.length >= 5}
                                    >
                                        <PlusCircle className="h-5 w-5 mr-1 text-green-500" />
                                        Add Another Impact
                                    </Button>
                                </div>
                                {renderErrorMessage('impacts')}
                            </FormItem>

                            <FormItem className="space-y-2">
                                <FormLabel className="text-base font-medium">Challenges</FormLabel>
                                <FormDescription>Identify the challenges or obstacles related to solving this problem.</FormDescription>
                                <div className="space-y-3">
                                    {challenges.map((challenge, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Limited public awareness about proper waste sorting"
                                                    value={challenge}
                                                    onChange={(e) => handleChallengeChange(index, e.target.value)}
                                                    className={errors.challenges && !challenge.trim() ? 'border-destructive' : ''}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveChallenge(index)}
                                                disabled={challenges.length <= 1}
                                                className={challenges.length <= 1 ? "invisible" : ""}
                                            >
                                                <MinusCircle className="h-5 w-5 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center mt-2"
                                        onClick={handleAddChallenge}
                                        disabled={challenges.length >= 5}
                                    >
                                        <PlusCircle className="h-5 w-5 mr-1 text-green-500" />
                                        Add Another Challenge
                                    </Button>
                                </div>
                                {renderErrorMessage('challenges')}
                            </FormItem>
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
                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full" />
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
    );
}
