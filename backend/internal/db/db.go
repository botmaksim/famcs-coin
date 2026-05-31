package db

import (
	"context"
	"fmt"
	"log"
	"os"

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

// RunMigrations runs the initial migration script
func (db *DB) RunMigrations(migrationPath string) error {
	content, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("unable to read migration file: %w", err)
	}

	_, err = db.Pool.Exec(context.Background(), string(content))
	if err != nil {
		return fmt.Errorf("unable to execute migration script: %w", err)
	}

	log.Println("Migrations executed successfully")
	return nil
}

// Close gracefully closes the connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
