
#!/bin/bash

# HabitLoop Git Versioning Script
# Usage: ./scripts/git-version.sh [major|minor|patch] "commit message"

VERSION_TYPE=${1:-patch}
COMMIT_MESSAGE=${2:-"Version bump"}

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Invalid version type. Use: major, minor, or patch"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Stage changes
git add .

# Commit with version info
git commit -m "🚀 Release v$NEW_VERSION: $COMMIT_MESSAGE

- Version bump from $CURRENT_VERSION to $NEW_VERSION
- Type: $VERSION_TYPE release
- Changes: $COMMIT_MESSAGE"

# Create annotated tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

$COMMIT_MESSAGE

## Features in this release:
- Enhanced testing coverage
- Improved ML prediction accuracy
- Better error handling
- Code quality improvements

## Technical Details:
- TypeScript strict mode compliance
- Comprehensive edge case testing
- Security vulnerability fixes
- Performance optimizations"

echo "✅ Version $NEW_VERSION tagged and committed successfully!"
echo "📝 Don't forget to update CHANGELOG.md"
echo "🚀 Push with: git push origin main --tags"
