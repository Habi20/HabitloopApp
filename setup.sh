#!/bin/bash

echo "🚀 Setting up Habit Tracker Local Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Check if DATABASE_URL is set
if grep -q "postgresql://username:password@localhost" .env; then
    echo "⚠️  Please update DATABASE_URL in .env with your actual database credentials"
fi

# Check if PostgreSQL is running locally
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL CLI detected"
    if pg_isready &> /dev/null; then
        echo "✅ PostgreSQL server is running"
    else
        echo "⚠️  PostgreSQL server is not running. Start it with:"
        echo "   brew services start postgresql  # macOS"
        echo "   sudo systemctl start postgresql  # Linux"
        echo "   Or use Docker: docker-compose up -d"
    fi
else
    echo "⚠️  PostgreSQL not detected. Options:"
    echo "   1. Install PostgreSQL locally"
    echo "   2. Use Docker: docker-compose up -d"
    echo "   3. Use cloud provider (Neon, Supabase, etc.)"
fi

# Check if Docker is available for easy setup
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. You can run: docker-compose up -d"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up your database (local PostgreSQL, Docker, or cloud)"
echo "3. Run: npm run db:push"
echo "4. Run: npm run dev"
echo ""
echo "📚 See README.md for detailed instructions"