#!/bin/bash

# --- CONFIGURATION ---
DB_CONTAINER_NAME="postgres-container"
DB_NAME="postgres"
DB_USER="admin"
BACKUP_DIR="./backup_db"
PRISMA_SCHEMA="api/prisma/schema.prisma"
ENV_FILE=".env"

# --- INSTALL NVM, NODE 20, PM2 ---
echo "?? Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "?? Installing Node.js 20..."
nvm install 22
nvm use 22

echo "?? Installing PM2 globally..."
npm install -g pm2

# --- INSTALL DEPENDENCIES ---
echo "?? Installing project dependencies..."
npm install

# --- START SERVICES ---
echo "?? Running Docker Compose..."
docker-compose up -d

echo "? Waiting for PostgreSQL container to be ready..."
sleep 10  # Gunakan wait-for-it jika butuh lebih aman

# --- PRISMA MIGRATE & GENERATE ---
echo "?? Running Prisma Migrate..."
npx prisma migrate deploy --schema=$PRISMA_SCHEMA --env-file=$ENV_FILE

echo ?? Generating Prisma Client..."
npx prisma generate --schema=$PRISMA_SCHEMA --env-file=$ENV_FILE