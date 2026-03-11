git add .
git commit -m "chore: sync latest changes and dependencies"
git push origin main

# List local branches
$branches = git branch --format="%(refname:short)" | Where-Object { $_ -ne "main" }

foreach ($branch in $branches) {
    Write-Host "Rebasing $branch onto main..."
    git checkout $branch
    git rebase main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Rebase failed for $branch. Please aborting and moving to next one."
        git rebase --abort
    }
}

git checkout main
Write-Host "Returning to main. All branches rebased or skipped due to conflicts."
