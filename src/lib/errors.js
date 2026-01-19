import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Custom API Error class for structured error handling
 */
export class APIError extends Error {
    constructor(message, status = 500, details = null) {
        super(message)
        this.name = 'APIError'
        this.status = status
        this.details = details
    }
}

/**
 * Centralized error handler for API routes
 * Converts various error types into consistent NextResponse format
 * 
 * @param {Error} error - The error to handle
 * @param {string} context - Optional context (e.g., "Creating problem")
 * @returns {NextResponse} Formatted error response
 */
export function handleAPIError(error, context = null) {
    // Log error for debugging (production: use proper logging service)
    console.error(`API Error${context ? ` (${context})` : ''}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
    })

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: e.code
                })),
            },
            { status: 400 }
        )
    }

    // Handle custom APIError
    if (error instanceof APIError) {
        return NextResponse.json(
            {
                error: error.message,
                ...(error.details && { details: error.details }),
            },
            { status: error.status }
        )
    }

    // Handle Supabase errors
    if (error.code) {
        // PostgreSQL/Supabase error codes
        const errorMap = {
            '23505': { message: 'Duplicate entry', status: 409 }, // unique_violation
            '23503': { message: 'Referenced record not found', status: 400 }, // foreign_key_violation
            '23514': { message: 'Data validation failed', status: 400 }, // check_violation
            'PGRST116': { message: 'Resource not found', status: 404 }, // Supabase not found
        }

        const mapped = errorMap[error.code]
        if (mapped) {
            return NextResponse.json(
                { error: mapped.message, code: error.code },
                { status: mapped.status }
            )
        }
    }

    // Handle generic errors (don't leak internals in production)
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
        {
            error: 'Internal server error',
            ...(isDevelopment && {
                message: error.message,
                stack: error.stack
            }),
        },
        { status: 500 }
    )
}

/**
 * Authentication error helper
 */
export function authError(message = 'Unauthorized') {
    return new APIError(message, 401)
}

/**
 * Validation error helper
 */
export function validationError(message, details = null) {
    return new APIError(message, 400, details)
}

/**
 * Not found error helper
 */
export function notFoundError(resource = 'Resource') {
    return new APIError(`${resource} not found`, 404)
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message = 'Forbidden') {
    return new APIError(message, 403)
}

/**
 * Async error wrapper for API route handlers
 * Automatically catches and handles errors
 * 
 * @param {Function} handler - Async API route handler
 * @returns {Function} Wrapped handler with error handling
 * 
 * @example
 * export const GET = withErrorHandling(async (request) => {
 *   const data = await fetchData()
 *   return NextResponse.json({ data })
 * })
 */
export function withErrorHandling(handler, context = null) {
    return async (...args) => {
        try {
            return await handler(...args)
        } catch (error) {
            return handleAPIError(error, context)
        }
    }
}
