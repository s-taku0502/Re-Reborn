#!/bin/bash
# Backup current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create a file with patterns to remove
cat > patterns.txt << 'PATTERNS'
AIzaSyB6OiG7qLU0Z0z1LE-9eCJEdMtjvRNKMEg
PATTERNS

# Use git filter-branch to remove sensitive data
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.production' \
  --prune-empty --tag-name-filter cat -- --all

echo "History cleaned. Next steps:"
echo "1. Review the changes"
echo "2. Force push: git push origin --force --all"
echo "3. Notify collaborators to re-clone the repository"
