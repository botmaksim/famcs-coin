package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB represents a connection to the database
type DB struct {
	Pool *pgxpool.Pool
}

// NewDB initializes a new database connection pool
func NewDB(databaseURL string) (*DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database url: %w", err)
	}

	// We can add specific pool configurations here, e.g. MaxConns
	// config.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Ping the database to ensure connection is established
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("Successfully connected to the database")

	return &DB{Pool: pool}, nil
}

// RunMigrations runs a single migration script
func (db *DB) RunMigrations(migrationPath string) error {
	content, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("unable to read migration file: %w", err)
	}

	_, err = db.Pool.Exec(context.Background(), string(content))
	if err != nil {
		return fmt.Errorf("unable to execute migration script %s: %w", migrationPath, err)
	}

	log.Printf("Migration executed successfully: %s\n", migrationPath)
	return nil
}

// RunAllMigrations reads a directory, sorts the SQL files and runs them sequentially,
// tracking applied migrations in the schema_migrations table so they only run once.
func (db *DB) RunAllMigrations(migrationsDir string) error {
	return RunMigrationsOnPool(context.Background(), db.Pool, migrationsDir)
}

// RunMigrationsOnPool runs all pending migrations on any pool implementing PgxPoolIface.
func RunMigrationsOnPool(ctx context.Context, pool PgxPoolIface, migrationsDir string) error {
	// Ensure migrations tracking table exists
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("unable to create schema_migrations table: %w", err)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("unable to read migrations directory: %w", err)
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".sql" {
			files = append(files, entry.Name())
		}
	}

	sort.Strings(files)

	for _, file := range files {
		var exists bool
		err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", file).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check migration status for %s: %w", file, err)
		}
		if exists {
			continue
		}

		migrationPath := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(migrationPath)
		if err != nil {
			return fmt.Errorf("unable to read migration file %s: %w", file, err)
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("unable to start transaction for migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, string(content)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("unable to execute migration script %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", file); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("unable to record migration %s: %w", file, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("unable to commit migration %s: %w", file, err)
		}

		log.Printf("Migration executed successfully: %s\n", file)
	}

	log.Println("All migrations processed successfully")
	return nil
}

// Close gracefully closes the connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
