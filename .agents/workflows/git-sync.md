---
description: Consolidate changes and rebase all branches onto main
---

To push your changes and ensure all local branches are up-to-date with your latest changes on `main`, run the following script (PowerShell):

```powershell
# 1. Commit any remaining changes
git add .
git commit -m "chore: sync latest changes"

# 2. Push to main
git checkout main
git push origin main

# 3. List all local branches (except main) and rebase them
$branches = git branch --format="%(refname:short)" | Where-Object { $_ -ne "main" }

foreach ($branch in $branches) {
    Write-Host "Rebasing $branch onto main..."
    git checkout $branch
    git rebase main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Rebase failed for $branch. Please resolve conflicts manually."
        git rebase --abort
    }
}

# 4. Return to main
git checkout main
Write-Host "Sync and Rebase complete."
```

Alternatively, save this as `sync-git.ps1` in the root and run `./sync-git.ps1`.
