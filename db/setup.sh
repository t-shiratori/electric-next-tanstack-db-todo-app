#!/bin/bash

# Database setup script for Electric SQL + TanStack DB
# Runs migrations via Docker container

set -e

DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-electric}
CONTAINER=${DOCKER_CONTAINER:-electric_quickstart-postgres-1}
MAX_RETRIES=30

echo "Setting up database schema..."

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Error: Docker container '${CONTAINER}' is not running"
    echo ""
    echo "Please start Docker Compose first:"
    echo "  docker compose up -d"
    echo ""
    echo "Then run this script again:"
    echo "  ./db/setup.sh"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
for i in $(seq 1 $MAX_RETRIES); do
    if docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        echo "✓ PostgreSQL is ready"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        echo "Error: PostgreSQL not ready after ${MAX_RETRIES} attempts"
        echo "Check logs: docker compose logs postgres"
        exit 1
    fi
    echo "  Waiting... (attempt $i/$MAX_RETRIES)"
    sleep 1
done

# Run migrations
echo "Applying migrations..."
for migration in db/migrations/*.sql; do
    if [ ! -f "$migration" ]; then
        echo "Warning: No migration files found"
        exit 0
    fi

    echo "  → $(basename "$migration")"
    if ! docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$migration" 2>&1 | grep -v "^NOTICE:"; then
        echo "Error: Failed to apply $migration"
        exit 1
    fi
done

echo "✓ Database setup complete"
