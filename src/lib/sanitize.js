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
 * 
 * NOTE: DOMPurify is LAZY-LOADED to prevent serverless cold-start crashes
 * All sanitization functions are async to support dynamic import
 */

// Lazy-loaded DOMPurify instance (prevents import-time crashes on Vercel)
let _dompurify = null;
let _dompurifyLoadFailed = false;

/**
 * Lazily load and cache DOMPurify
 * Prevents import-time crashes in Vercel serverless environment
 * @returns {Promise<object|null>} DOMPurify instance or null if failed
 */
async function getDOMPurify() {
    if (_dompurify) return _dompurify;
    if (_dompurifyLoadFailed) return null;

    try {
        const mod = await import('isomorphic-dompurify');
        _dompurify = mod.default || mod;
        console.log('DOMPurify loaded successfully');
        return _dompurify;
    } catch (e) {
        console.error('DOMPurify failed to load:', e.message, e.stack);
        _dompurifyLoadFailed = true;
        return null;
    }
}

/**
 * Escape HTML entities (fallback when DOMPurify unavailable)
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
 * Sanitize a single string to prevent XSS attacks
 * 
 * @param {string} input - User input to sanitize
 * @param {object} options - DOMPurify configuration
 * @returns {Promise<string>} Sanitized string
 * 
 * @example
 * const userInput = "<script>alert('xss')</script>Hello"
 * const safe = await sanitizeInput(userInput)
 * // safe = "Hello"
 */
export async function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
        console.warn('sanitizeInput: Expected string, got', typeof input);
        return '';
    }

    try {
        const DOMPurify = await getDOMPurify();
        if (DOMPurify) {
            // Default configuration: Strip all HTML tags
            const config = {
                ALLOWED_TAGS: [], // No HTML tags allowed by default
                ALLOWED_ATTR: [], // No attributes allowed
                KEEP_CONTENT: true, // Keep text content, remove tags
                ...options
            };
            return DOMPurify.sanitize(input, config).trim();
        }
    } catch (e) {
        console.error('sanitizeInput failed, using fallback:', e.message);
    }

    // Fallback to simple HTML escaping
    return escapeHTML(input).trim();
}

/**
 * Sanitize an object's string properties
 * Recursively processes nested objects and arrays
 * 
 * @param {object} obj - Object to sanitize
 * @param {object} options - DOMPurify configuration
 * @returns {Promise<object>} Sanitized object
 */
export async function sanitizeObject(obj, options = {}) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        const results = await Promise.all(
            obj.map(async (item) => {
                if (typeof item === 'string') {
                    return sanitizeInput(item, options);
                } else if (typeof item === 'object') {
                    return sanitizeObject(item, options);
                }
                return item;
            })
        );
        return results;
    }

    // Handle objects
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = await sanitizeInput(value, options);
            } else if (typeof value === 'object') {
                sanitized[key] = await sanitizeObject(value, options);
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
 * Allows some safe formatting tags in description
 * 
 * @param {object} problemData - Problem data from API
 * @returns {Promise<object>} Sanitized problem data
 */
export async function sanitizeProblemData(problemData) {
    // For description, allow safe formatting tags
    const descriptionConfig = {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
    };

    try {
        const DOMPurify = await getDOMPurify();

        // Sanitize title (strip all HTML)
        const title = await sanitizeInput(problemData.title);

        // Sanitize description (allow formatting)
        let description;
        if (DOMPurify) {
            description = DOMPurify.sanitize(problemData.description, descriptionConfig).trim();
        } else {
            description = escapeHTML(problemData.description).trim();
        }

        // Sanitize arrays
        const tags = problemData.tags
            ? await Promise.all(problemData.tags.map(tag => sanitizeInput(tag)))
            : [];
        const impacts = problemData.impacts
            ? await Promise.all(problemData.impacts.map(impact => sanitizeInput(impact)))
            : [];
        const challenges = problemData.challenges
            ? await Promise.all(problemData.challenges.map(challenge => sanitizeInput(challenge)))
            : [];

        return {
            ...problemData,
            title,
            description,
            tags,
            impacts,
            challenges,
        };
    } catch (e) {
        console.error('sanitizeProblemData failed:', e.message);
        // Return escaped fallback
        return {
            ...problemData,
            title: escapeHTML(problemData.title),
            description: escapeHTML(problemData.description),
            tags: (problemData.tags || []).map(t => escapeHTML(t)),
            impacts: (problemData.impacts || []).map(i => escapeHTML(i)),
            challenges: (problemData.challenges || []).map(c => escapeHTML(c)),
        };
    }
}

/**
 * Sanitize comment/reply text
 * Allows basic formatting for better UX
 * 
 * @param {string} text - Comment text
 * @returns {Promise<string>} Sanitized text
 */
export async function sanitizeCommentText(text) {
    const config = {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'a'],
        ALLOWED_ATTR: ['href'], // Allow links
        ALLOWED_URI_REGEXP: /^https?:\/\// // Only allow http(s) links
    };

    try {
        const DOMPurify = await getDOMPurify();
        if (DOMPurify) {
            return DOMPurify.sanitize(text, config).trim();
        }
    } catch (e) {
        console.error('sanitizeCommentText failed, using fallback:', e.message);
    }

    // Fallback to simple escaping
    return escapeHTML(text).trim();
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
