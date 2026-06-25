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

// RunAllMigrations reads a directory, sorts the SQL files and runs them sequentially.
func (db *DB) RunAllMigrations(migrationsDir string) error {
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
		migrationPath := filepath.Join(migrationsDir, file)
		if err := db.RunMigrations(migrationPath); err != nil {
			return err
		}
	}

	log.Println("All migrations executed successfully")
	return nil
}

// Close gracefully closes the connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
