import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankBadge, RankBadgeWithPoints } from '../rank-badge';

describe('RankBadge', () => {
  it('should render rank badge with correct rank', () => {
    render(<RankBadge rank="A" />);
    
    const badge = screen.getByText('A');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should render rank badge with label when showLabel is true', () => {
    render(<RankBadge rank="S" showLabel={true} />);
    
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    render(<RankBadge rank="B" size="lg" />);
    
    const badge = screen.getByText('B');
    expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-1');
  });

  it('should apply custom className', () => {
    render(<RankBadge rank="C" className="custom-class" />);
    
    const badge = screen.getByText('C');
    expect(badge).toHaveClass('custom-class');
  });

  it('should handle unknown rank gracefully', () => {
    render(<RankBadge rank={'X' as any} />);
    
    const badge = screen.getByText('X');
    // Should fall back to F rank styling
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});

describe('RankBadgeWithPoints', () => {
  it('should render rank badge with points', () => {
    render(<RankBadgeWithPoints rank="A" points={1500} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1,500 pts')).toBeInTheDocument();
  });

  it('should not render points when points is 0', () => {
    render(<RankBadgeWithPoints rank="F" points={0} />);
    
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it('should format large point numbers correctly', () => {
    render(<RankBadgeWithPoints rank="S" points={1000000} />);
    
    expect(screen.getByText('1,000,000 pts')).toBeInTheDocument();
  });
});
