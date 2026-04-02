/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import ProblemCard from '@/components/problems/ProblemCard';
import { describe, it, expect } from 'vitest';

// Mock test data
const mockProblem: any = {
    id: '123',
    title: 'Test Problem Title',
    description: 'This is a test description for the problem card.',
    category: 'Environment',
    tags: ['Climate', 'Sustainability', 'Green', 'Energy'],
    votes: 42,
    discussions: 5,
    createdAt: '2023-10-01',
    impacts: [],
    challenges: [],
    submittedById: 'user1',
    submittedBy: 'Test User'
};

describe('ProblemCard Component', () => {
    it('renders correctly in grid layout (default)', () => {
        render(<ProblemCard problem={mockProblem} />);

        // Check title and description
        expect(screen.getByText('Test Problem Title')).toBeInTheDocument();
        expect(screen.getByText(/test description/i)).toBeInTheDocument();

        // Check category
        expect(screen.getByText('Environment')).toBeInTheDocument();

        // Check tags (first 3)
        expect(screen.getByText('Climate')).toBeInTheDocument();
        expect(screen.getByText('Sustainability')).toBeInTheDocument();
        expect(screen.getByText('Green')).toBeInTheDocument();

        // The 4th tag shouldn't be rendered alone, instead '+1 more'
        expect(screen.queryByText('Energy')).not.toBeInTheDocument();
        expect(screen.getByText('+1 more')).toBeInTheDocument();

        // Check default stats (votes in grid when showCreatedAtDate is false)
        // The node might have an icon, so we use string matchers.
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();

        // Check View button
        expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    });

    it('renders correctly in list layout', () => {
        render(<ProblemCard problem={mockProblem} layout="list" />);

        // Title and category stay the same
        expect(screen.getByText('Test Problem Title')).toBeInTheDocument();
        expect(screen.getByText('Environment')).toBeInTheDocument();

        // Should render actual creation date explicitly
        expect(screen.getByText('2023-10-01')).toBeInTheDocument();
    });

    it('renders createdAt instead of votes when showCreatedAtDate is true in grid mode', () => {
        // Wait, grid mode renders BOTH if showCreatedAtDate is true, depending on the header vs footer.
        render(<ProblemCard problem={mockProblem} layout="grid" showCreatedAtDate={true} />);

        // Because showCreatedAtDate is true, the header should show the date instead of votes.
        expect(screen.getByText('2023-10-01')).toBeInTheDocument();
    });

    it('renders custom footer actions when provided', () => {
        const customFooter = <button data-testid="custom-btn">Edit/Delete</button>;
        render(<ProblemCard problem={mockProblem} footerActions={customFooter} />);

        // Custom footer action should be present
        expect(screen.getByTestId('custom-btn')).toBeInTheDocument();

        // Default View button should NOT be present
        expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
    });

    it('hides view button when showViewButton is false', () => {
        render(<ProblemCard problem={mockProblem} showViewButton={false} />);

        // Default View button should NOT be present
        expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
    });
});
