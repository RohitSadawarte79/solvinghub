/** @type {import('next').NextConfig} */
const nextConfig = {
    // Security Headers
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        // Prevent clickjacking attacks
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        // Prevent XSS attacks
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        // Prevent MIME type sniffing
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        // Referrer policy for privacy
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        // Permissions Policy (formerly Feature Policy)
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        // Strict Transport Security (HTTPS only)
                        // Enable in production when you have HTTPS
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    }
                ]
            }
        ]
    },

    // Image domains for external images (e.g., Google OAuth avatars)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/**',
            }
        ]
    }
};

export default nextConfig;
