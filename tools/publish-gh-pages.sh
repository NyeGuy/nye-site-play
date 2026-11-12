#!/usr/bin/env bash
# Publish viewport-3d/ as the root of the gh-pages branch (GitHub Pages: Deploy from a branch → gh-pages, / (root)).
# Run from the repo root on the branch that has the version you want to preview. Needs push access.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git branch -D gh-pages-build 2>/dev/null || true
git subtree split --prefix viewport-3d -b gh-pages-build
git push --force origin gh-pages-build:gh-pages     # gh-pages only ever holds this static build
git branch -D gh-pages-build
echo "Published. Preview: https://nyeguy.github.io/nye-site-play/ (Pages can take a minute to rebuild)"
