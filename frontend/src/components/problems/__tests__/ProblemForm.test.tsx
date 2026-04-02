/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProblemForm from '@/components/problems/ProblemForm';
import { describe, it, expect, vi } from 'vitest';

// Provide the ResizeObserver polyfill for radix-ui used by shadcn Select (can crash without it)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('ProblemForm Component', () => {
    it('renders blank form initially', () => {
        render(<ProblemForm onSubmit={vi.fn()} />);

        expect(screen.getByLabelText(/Title/i)).toHaveValue('');
        expect(screen.getByLabelText(/Description/i)).toHaveValue('');
        expect(screen.getByText(/Submit/i)).toBeInTheDocument();
    });

    it('validates empty form submission', async () => {
        const mockSubmit = vi.fn();
        const user = userEvent.setup();

        render(<ProblemForm onSubmit={mockSubmit} />);

        // Submitting early should show validation errors
        const submitBtn = screen.getByRole('button', { name: "Submit" });
        await user.click(submitBtn);

        // Call should not happen
        expect(mockSubmit).not.toHaveBeenCalled();

        // Check errors
        expect(await screen.findByText("Title is required")).toBeInTheDocument();
        expect(screen.getByText("Description is required")).toBeInTheDocument();
        expect(screen.getByText("Category is required")).toBeInTheDocument();
        expect(screen.getByText("At least one tag is required")).toBeInTheDocument();
    });

    it('handles adding and removing tags', async () => {
        const user = userEvent.setup();
        render(<ProblemForm onSubmit={vi.fn()} />);

        const tagInput = screen.getByPlaceholderText(/Sustainability/i);
        // Since we mocked `lucide-react`, the Plus icon is rendered, but it doesn't give a specific label. 
        // We can simulate an 'Enter' keypress to add a tag instead.

        await user.type(tagInput, 'Climate{enter}');

        // Tag should be present
        expect(await screen.findByText('Climate')).toBeInTheDocument();

        // Input should clear
        expect(tagInput).toHaveValue('');

        // Remove the tag
        const tagElement = screen.getByText('Climate');
        const removeBtn = tagElement.nextElementSibling || tagElement.parentElement.querySelector('button');

        await user.click(removeBtn);

        // Wait for removal
        await waitFor(() => {
            expect(screen.queryByText('Climate')).not.toBeInTheDocument();
        });
    });

    it('handles initial data correctly', () => {
        const initialData = {
            title: 'Edited Title',
            description: 'Edited Description over 50 chars.......................',
            category: 'Healthcare',
            tags: ['Health', 'Tech'],
            impacts: ['Impact 1'],
            challenges: ['Challenge 1']
        };

        render(<ProblemForm initialData={initialData} onSubmit={vi.fn()} submitLabel="Update" />);

        expect(screen.getByLabelText(/Title/i)).toHaveValue('Edited Title');
        expect(screen.getByLabelText(/Description/i)).toHaveValue('Edited Description over 50 chars.......................');
        expect(screen.getAllByText('Health').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Tech').length).toBeGreaterThan(0);

        // Custom submit label
        expect(screen.getByRole('button', { name: "Update" })).toBeInTheDocument();
    });
});
