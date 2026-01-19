/**
 * Input Sanitization Utility
 * 
 * Prevents XSS (Cross-Site Scripting) attacks by sanitizing user input
 * Uses DOMPurify for comprehensive HTML/JS sanitization
 * 
 * IMPORTANT: Always sanitize user input before:
 * - Storing in database
 * - Displaying in UI
 * - Using in API responses
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize a single string to prevent XSS attacks
 * 
 * @param {string} input - User input to sanitize
 * @param {object} options - DOMPurify configuration
 * @returns {string} Sanitized string
 * 
 * @example
 * const userInput = "<script>alert('xss')</script>Hello"
 * const safe = sanitizeInput(userInput)
 * // safe = "Hello"
 */
export function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
        console.warn('sanitizeInput: Expected string, got', typeof input)
        return ''
    }

    // Default configuration: Strip all HTML tags
    const config = {
        ALLOWED_TAGS: [], // No HTML tags allowed by default
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content, remove tags
        ...options
    }

    return DOMPurify.sanitize(input, config).trim()
}

/**
 * Sanitize an object's string properties
 * Recursively processes nested objects and arrays
 * 
 * @param {object} obj - Object to sanitize
 * @param {object} options - DOMPurify configuration
 * @returns {object} Sanitized object
 * 
 * @example
 * const userData = {
 *   name: "<script>alert('xss')</script>John",
 *   bio: "Hello <b>world</b>",
 *   tags: ["<img onerror=alert(1)>", "safe"]
 * }
 * const safe = sanitizeObject(userData)
 * // safe = { name: "John", bio: "Hello world", tags: ["", "safe"] }
 */
export function sanitizeObject(obj, options = {}) {
    if (obj === null || obj === undefined) {
        return obj
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'string') {
                return sanitizeInput(item, options)
            } else if (typeof item === 'object') {
                return sanitizeObject(item, options)
            }
            return item
        })
    }

    // Handle objects
    if (typeof obj === 'object') {
        const sanitized = {}
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value, options)
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value, options)
            } else {
                sanitized[key] = value
            }
        }
        return sanitized
    }

    // Return non-string, non-object values as-is
    return obj
}

/**
 * Sanitize problem data before storing in database
 * Allows some safe formatting tags in description
 * 
 * @param {object} problemData - Problem data from API
 * @returns {object} Sanitized problem data
 */
export function sanitizeProblemData(problemData) {
    // For description, allow safe formatting tags
    const descriptionConfig = {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
    }

    return {
        ...problemData,
        title: sanitizeInput(problemData.title),
        description: DOMPurify.sanitize(problemData.description, descriptionConfig).trim(),
        tags: problemData.tags?.map(tag => sanitizeInput(tag)) || [],
        impacts: problemData.impacts?.map(impact => sanitizeInput(impact)) || [],
        challenges: problemData.challenges?.map(challenge => sanitizeInput(challenge)) || [],
    }
}

/**
 * Sanitize comment/reply text
 * Allows basic formatting for better UX
 * 
 * @param {string} text - Comment text
 * @returns {string} Sanitized text
 */
export function sanitizeCommentText(text) {
    const config = {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'a'],
        ALLOWED_ATTR: ['href'], // Allow links
        ALLOWED_URI_REGEXP: /^https?:\/\// // Only allow http(s) links
    }

    return DOMPurify.sanitize(text, config).trim()
}

/**
 * Escape HTML entities (alternative to sanitization)
 * Use when you want to display user input AS-IS but safely
 * 
 * @param {string} text - Text to escape
 * @returns {string} HTML-safe text
 * 
 * @example
 * escapeHTML("<script>alert(1)</script>")
 * // "&lt;script&gt;alert(1)&lt;/script&gt;"
 */
export function escapeHTML(text) {
    if (typeof text !== 'string') return ''

    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }

    return text.replace(/[&<>"']/g, char => htmlEscapes[char])
}

/**
 * Validate URL to prevent javascript: and data: URIs
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe, false otherwise
 */
export function isSafeURL(url) {
    if (typeof url !== 'string') return false

    const trimmed = url.trim().toLowerCase()

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    for (const protocol of dangerousProtocols) {
        if (trimmed.startsWith(protocol)) {
            return false
        }
    }

    // Allow http(s), mailto, tel
    const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:']
    for (const protocol of safeProtocols) {
        if (trimmed.startsWith(protocol)) {
            return true
        }
    }

    // Relative URLs are safe
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
        return true
    }

    return false
}

/**
 * Sanitize URL by validating and cleaning
 * 
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string
 */
export function sanitizeURL(url) {
    if (!isSafeURL(url)) {
        console.warn('Blocked unsafe URL:', url)
        return ''
    }
    return url.trim()
}
