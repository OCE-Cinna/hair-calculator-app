@echo off
git checkout main
git cherry-pick 7977b5b

git checkout feature/updating-parting-algorithm
git cherry-pick 66919f0

git checkout feature/devkit
