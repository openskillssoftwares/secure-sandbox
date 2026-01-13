#!/bin/bash

# Phase 1 Quick Start Script
# This script helps automate the Phase 1 setup process

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                                 ║"
echo "║   Phase 1 Setup: OAuth & Enhanced Backend                      ║"
echo "║                                                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

cd backend

echo "📦 Step 1: Installing dependencies..."
echo ""
npm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your credentials:"
        echo "   - Google OAuth credentials"
        echo "   - GitHub OAuth credentials"
        echo "   - Database credentials"
        echo "   - Session secret"
        echo "   - Admin emails"
        echo ""
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
    echo ""
fi

echo "🗄️  Step 2: Database Setup"
echo ""
echo "Please run the following command to apply database schema enhancements:"
echo ""
echo "  psql -U postgres -d secure_pentest_db -f database/schema-phase1-enhancements.sql"
echo ""
echo "Or use pgAdmin to execute the schema-phase1-enhancements.sql file"
echo ""

read -p "Have you applied the database schema? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please apply the database schema before continuing"
    echo "After applying the schema, you can start the server with: npm run dev"
    exit 0
fi

echo ""
echo "🔐 Step 3: OAuth Configuration"
echo ""
echo "Make sure you have configured OAuth credentials in .env:"
echo ""
echo "Google OAuth:"
echo "  1. Go to https://console.cloud.google.com/"
echo "  2. Create OAuth 2.0 credentials"
echo "  3. Add callback URL: http://localhost:5000/api/auth/google/callback"
echo ""
echo "GitHub OAuth:"
echo "  1. Go to https://github.com/settings/developers"
echo "  2. Create new OAuth App"
echo "  3. Add callback URL: http://localhost:5000/api/auth/github/callback"
echo ""

read -p "Have you configured OAuth credentials in .env? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please configure OAuth credentials in .env before starting the server"
    echo "Edit backend/.env and add your OAuth credentials"
    exit 0
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                                 ║"
echo "║   ✅ Phase 1 Setup Complete!                                   ║"
echo "║                                                                 ║"
echo "║   You can now start the development server:                    ║"
echo "║                                                                 ║"
echo "║   cd backend                                                    ║"
echo "║   npm run dev                                                   ║"
echo "║                                                                 ║"
echo "║   Then test OAuth at:                                          ║"
echo "║   • Google: http://localhost:5000/api/auth/google              ║"
echo "║   • GitHub: http://localhost:5000/api/auth/github              ║"
echo "║                                                                 ║"
echo "║   See PHASE1_SETUP.md for full documentation                   ║"
echo "║                                                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
