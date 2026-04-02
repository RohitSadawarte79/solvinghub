export const CATEGORIES = [
    "Education",
    "Technology",
    "Health",
    "Environment",
    "Food & Agriculture",
    "Transportation",
    "Finance",
    "Social"
];

export const DIFFICULTIES = [
    { value: 'beginner', label: 'Beginner', description: 'Simple problem, anyone can solve' },
    { value: 'easy', label: 'Easy', description: 'Straightforward with known solution path' },
    { value: 'medium', label: 'Medium', description: 'Requires some expertise and effort' },
    { value: 'hard', label: 'Hard', description: 'Complex problem needing advanced skills' },
    { value: 'expert', label: 'Expert', description: 'Very challenging, requires specialized knowledge' }
];

export const DIFFICULTY_COLORS = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    easy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

// Rank access mapping - which difficulty levels each rank can access
export const RANK_ACCESS_MAP: Record<string, string[]> = {
    'F': ['beginner'],
    'E': ['beginner', 'easy'],
    'D': ['beginner', 'easy', 'medium'],
    'C': ['beginner', 'easy', 'medium', 'hard'],
    'B': ['beginner', 'easy', 'medium', 'hard'],
    'A': ['beginner', 'easy', 'medium', 'hard', 'expert'],
    'S': ['beginner', 'easy', 'medium', 'hard', 'expert']
};

export const RANK_LABELS: Record<string, string> = {
    'F': 'Novice',
    'E': 'Apprentice',
    'D': 'Contributor',
    'C': 'Specialist',
    'B': 'Expert',
    'A': 'Master',
    'S': 'Legend'
};
