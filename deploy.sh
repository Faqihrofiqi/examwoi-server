#!/bin/bash

echo "?? Deploying Examwoi LMS..."
git pull origin main

echo "?? Installing dependencies..."
npm install

echo "?? Running database migration, seed, generate..."
npm run prisma:full

echo "??? Building frontend..."
npm run build:frontend

echo ?? Restarting app with PM2..."
pm2 delete all
npm run start:all

echo "? Deployment complete!"
