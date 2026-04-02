import '@testing-library/jest-dom'

// Note: Next.js router and features should be mocked here if needed globally.
// We can mock 'next/navigation' globally so components using useRouter don't crash in tests.

import { vi } from 'vitest'

// Global mock for next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '',
}))
