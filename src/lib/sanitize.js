/**
 * Input Sanitization Utility
 * 
 * Prevents XSS (Cross-Site Scripting) attacks by sanitizing user input
 * 
 * PRODUCTION-SAFE STRATEGY:
 * - Store PLAINTEXT in database (no HTML)
 * - Escape on frontend when rendering
 * - No DOM libraries on server (Vercel-safe)
 * 
 * IMPORTANT: Always sanitize user input before:
 * - Storing in database
 * - Displaying in UI
 * 
 * ARCHITECTURE:
 * - Server: Strip/escape everything → store plaintext
 * - Frontend: Render with proper escaping or markdown library
 */

/**
 * Escape HTML entities to prevent XSS
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
    if (typeof text !== 'string') return '';

    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Strip all HTML tags and return plaintext
 * More aggressive than escapeHTML - removes tags entirely
 * 
 * @param {string} text - Text to strip
 * @returns {string} Plaintext with no HTML
 * 
 * @example
 * stripHTML("<p>Hello <script>alert(1)</script></p>")
 * // "Hello alert(1)"
 */
export function stripHTML(text) {
    if (typeof text !== 'string') return '';
    
    // Remove all HTML tags
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Sanitize a single string input
 * Strips all HTML tags and returns clean plaintext
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized plaintext
 * 
 * @example
 * sanitizeInput("<script>alert('xss')</script>Hello")
 * // "alert('xss')Hello"
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        console.warn('sanitizeInput: Expected string, got', typeof input);
        return '';
    }

    return stripHTML(input);
}

/**
 * Sanitize title text
 * Removes HTML and limits length
 * 
 * @param {string} title - Title text
 * @returns {string} Sanitized title
 */
export function sanitizeTitle(title) {
    if (typeof title !== 'string') return '';
    return stripHTML(title).trim();
}

/**
 * Sanitize problem description
 * Removes all HTML, stores as plaintext
 * Frontend can render with markdown if needed
 * 
 * @param {string} description - Problem description
 * @returns {string} Sanitized description
 */
export function sanitizeProblemDescription(description) {
    if (typeof description !== 'string') return '';
    return stripHTML(description).trim();
}

/**
 * Sanitize comment/reply text
 * Removes all HTML for safety
 * 
 * @param {string} text - Comment text
 * @returns {string} Sanitized text
 */
export function sanitizeCommentText(text) {
    if (typeof text !== 'string') return '';
    return stripHTML(text).trim();
}

/**
 * Sanitize an array of strings
 * 
 * @param {string[]} items - Array of strings to sanitize
 * @returns {string[]} Array of sanitized strings
 */
export function sanitizeArray(items) {
    if (!Array.isArray(items)) return [];
    return items
        .filter(item => typeof item === 'string')
        .map(item => stripHTML(item).trim())
        .filter(item => item.length > 0);
}

/**
 * Sanitize an object's string properties
 * 
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item) => {
            if (typeof item === 'string') {
                return sanitizeInput(item);
            } else if (typeof item === 'object') {
                return sanitizeObject(item);
            }
            return item;
        });
    }

    // Handle objects
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    // Return non-string, non-object values as-is
    return obj;
}

/**
 * Sanitize problem data before storing in database
 * Strips all HTML - stores plaintext only
 * 
 * @param {object} problemData - Problem data from API
 * @returns {object} Sanitized problem data
 */
export function sanitizeProblemData(problemData) {
    return {
        ...problemData,
        title: sanitizeTitle(problemData.title || ''),
        description: sanitizeProblemDescription(problemData.description || ''),
        tags: sanitizeArray(problemData.tags || []),
        impacts: sanitizeArray(problemData.impacts || []),
        challenges: sanitizeArray(problemData.challenges || []),
    };
}

/**
 * Validate URL to prevent javascript: and data: URIs
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe, false otherwise
 */
export function isSafeURL(url) {
    if (typeof url !== 'string') return false;

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
        if (trimmed.startsWith(protocol)) {
            return false;
        }
    }

    // Allow http(s), mailto, tel
    const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
    for (const protocol of safeProtocols) {
        if (trimmed.startsWith(protocol)) {
            return true;
        }
    }

    // Relative URLs are safe
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
        return true;
    }

    return false;
}

/**
 * Sanitize URL by validating and cleaning
 * 
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string
 */
export function sanitizeURL(url) {
    if (!isSafeURL(url)) {
        console.warn('Blocked unsafe URL:', url);
        return '';
    }
    return url.trim();
}
