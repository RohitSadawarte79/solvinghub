-- Migration: 008_create_user_problem_views.sql

CREATE TABLE user_problem_views (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX idx_user_problem_views_user_id ON user_problem_views(user_id);
