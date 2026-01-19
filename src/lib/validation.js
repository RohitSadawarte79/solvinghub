import { z } from 'zod'

// Problem validation schema
export const problemSchema = z.object({
    title: z
        .string()
        .min(10, 'Title must be at least 10 characters')
        .max(200, 'Title must not exceed 200 characters')
        .trim(),

    description: z
        .string()
        .min(50, 'Description must be at least 50 characters')
        .max(5000, 'Description must not exceed 5000 characters')
        .trim(),

    category: z.enum([
        'Education',
        'Technology',
        'Health',
        'Environment',
        'Food & Agriculture',
        'Transportation',
        'Finance',
        'Social',
    ], {
        required_error: 'Category is required',
        invalid_type_error: 'Invalid category',
    }),

    tags: z
        .array(z.string().trim().min(1))
        .min(1, 'At least one tag is required')
        .max(5, 'Maximum 5 tags allowed')
        .refine((tags) => new Set(tags).size === tags.length, {
            message: 'Tags must be unique',
        }),

    impacts: z
        .array(z.string().trim().min(1))
        .min(1, 'At least one impact is required')
        .max(5, 'Maximum 5 impacts allowed'),

    challenges: z
        .array(z.string().trim().min(1))
        .min(1, 'At least one challenge is required')
        .max(5, 'Maximum 5 challenges allowed'),
})

// Comment validation schema
export const commentSchema = z.object({
    text: z
        .string()
        .min(1, 'Comment cannot be empty')
        .max(2000, 'Comment must not exceed 2000 characters')
        .trim(),
})

// Reply validation schema
export const replySchema = z.object({
    text: z
        .string()
        .min(1, 'Reply cannot be empty')
        .max(1000, 'Reply must not exceed 1000 characters')
        .trim(),
})

// Problem status enum
export const problemStatusEnum = z.enum([
    'open',
    'active',
    'has_solutions',
    'solved',
    'archived',
])

// Pagination params
export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor_id: z.string().uuid().optional(),
    cursor_created_at: z.string().datetime().optional(),
})

// Sort options
export const sortBySchema = z.enum(['votes', 'discussions', 'created_at']).default('created_at')

// Filter schema
export const problemFilterSchema = z.object({
    category: z.string().optional(),
    status: problemStatusEnum.optional(),
    search: z.string().max(200).optional(),
    sort_by: sortBySchema,
})

// Helper to validate and sanitize inputs
export function validateProblem(data) {
    return problemSchema.parse(data)
}

export function validateComment(data) {
    return commentSchema.parse(data)
}

export function validateReply(data) {
    return replySchema.parse(data)
}

// Calculate quality score client-side (should match DB function)
export function calculateQualityScore(problem) {
    let score = 0.0

    // Title length (max 0.2)
    score += Math.min((problem.title?.length || 0) / 100.0, 0.2)

    // Description length (max 0.3)
    score += Math.min((problem.description?.length || 0) / 500.0, 0.3)

    // Tags count (max 0.2)
    score += Math.min((problem.tags?.length || 0) / 5.0 * 0.2, 0.2)

    // Impacts count (max 0.15)
    score += Math.min((problem.impacts?.length || 0) / 3.0 * 0.15, 0.15)

    // Challenges count (max 0.15)
    score += Math.min((problem.challenges?.length || 0) / 3.0 * 0.15, 0.15)

    return Math.min(score, 1.0).toFixed(2)
}
