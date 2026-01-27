#!/bin/bash

# Setup script for True Coding git hooks
# Enforces TBD workflow by blocking commits to main

echo "🔧 Setting up True Coding git hooks..."

# Configure git to use .githooks directory
git config core.hooksPath .githooks

# Make all hooks executable
chmod +x .githooks/*

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 Workflow enforcement enabled:"
echo "  - Direct commits to 'main' are now BLOCKED"
echo "  - You must use feature branches + PRs"
echo ""
echo "💡 See CLAUDE.md for complete workflow"
