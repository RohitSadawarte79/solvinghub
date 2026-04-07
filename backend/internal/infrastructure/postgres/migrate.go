package postgres

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// RunMigrations executes all *.sql files from migrationsDir in lexicographic
// order. Each file is run in its own transaction so a failure is isolated.
// All migration SQL must use IF NOT EXISTS / ON CONFLICT guards so it is safe
// to re-run on every startup.
func RunMigrations(db *sql.DB, migrationsDir string) error {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("migrate: read dir %q: %w", migrationsDir, err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, filepath.Join(migrationsDir, e.Name()))
		}
	}
	sort.Strings(files) // 001_, 002_, … order

	for _, f := range files {
		if err := runFile(db, f); err != nil {
			return err
		}
	}
	return nil
}

func runFile(db *sql.DB, path string) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("migrate: read %q: %w", path, err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("migrate: begin tx for %q: %w", path, err)
	}

	if _, err := tx.Exec(string(content)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("migrate: exec %q: %w", path, err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("migrate: commit %q: %w", path, err)
	}

	fmt.Printf("migrate: applied %s\n", filepath.Base(path))
	return nil
}
