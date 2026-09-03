package db

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestRunMigrationsOnPool(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "migrations_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	// Create test migration files: 0001_test.sql (already applied) and 0002_test.sql (new)
	err = os.WriteFile(filepath.Join(tmpDir, "0001_test.sql"), []byte("SELECT 1;"), 0644)
	assert.NoError(t, err)
	err = os.WriteFile(filepath.Join(tmpDir, "0002_test.sql"), []byte("CREATE TABLE dummy (id INT);"), 0644)
	assert.NoError(t, err)

	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	ctx := context.Background()

	// 1. Expect schema_migrations table creation
	mock.ExpectExec("^\\s*CREATE TABLE IF NOT EXISTS schema_migrations").
		WillReturnResult(pgxmock.NewResult("CREATE", 1))

	// 2. First file (0001_test.sql) already exists in schema_migrations
	mock.ExpectQuery("^SELECT EXISTS\\(SELECT 1 FROM schema_migrations WHERE version = \\$1\\)").
		WithArgs("0001_test.sql").
		WillReturnRows(mock.NewRows([]string{"exists"}).AddRow(true))

	// 3. Second file (0002_test.sql) does NOT exist in schema_migrations
	mock.ExpectQuery("^SELECT EXISTS\\(SELECT 1 FROM schema_migrations WHERE version = \\$1\\)").
		WithArgs("0002_test.sql").
		WillReturnRows(mock.NewRows([]string{"exists"}).AddRow(false))

	// Expect transaction begin for 0002_test.sql
	mock.ExpectBegin()
	mock.ExpectExec("^CREATE TABLE dummy \\(id INT\\);").
		WillReturnResult(pgxmock.NewResult("CREATE", 1))
	mock.ExpectExec("^INSERT INTO schema_migrations \\(version\\) VALUES \\(\\$1\\)").
		WithArgs("0002_test.sql").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	mock.ExpectCommit()

	err = RunMigrationsOnPool(ctx, mock, tmpDir)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestNewDB_Validation(t *testing.T) {
	// Empty URL
	db1, err1 := NewDB("")
	assert.Error(t, err1)
	assert.Nil(t, db1)
	assert.Contains(t, err1.Error(), "DATABASE_URL is required")

	// Invalid URL
	db2, err2 := NewDB("://invalid-url")
	assert.Error(t, err2)
	assert.Nil(t, db2)
}

func TestRunMigrationsOnPool_Errors(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	ctx := context.Background()

	// 1. Missing directory
	err = RunMigrationsOnPool(ctx, mock, "/non-existent-dir-12345")
	assert.Error(t, err)

	// 2. Table creation fails
	mock.ExpectExec("^\\s*CREATE TABLE IF NOT EXISTS schema_migrations").
		WillReturnError(assert.AnError)
	tmpDir, _ := os.MkdirTemp("", "mig_err_*")
	defer os.RemoveAll(tmpDir)

	err = RunMigrationsOnPool(ctx, mock, tmpDir)
	assert.Error(t, err)
}

