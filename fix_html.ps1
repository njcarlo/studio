$ErrorActionPreference = "Continue"
$files = Get-ChildItem -Path "c:\Users\Jace\Antigravity\studio\out" -Filter *.html -Recurse
foreach ($file in $files) {
    try {
        $path = $file.FullName
        $content = [System.IO.File]::ReadAllText($path)
        
        # 1. Fix double semicolons first (from previous run)
        $newContent = $content -replace ';;', ';'
        
        # 2. Add semicolon to [0] push if missing
        $newContent = $newContent -replace '\.push\(\[0\]\)(?!;)', '.push([0]);'
        
        # 3. Add semicolon to other pushes if missing
        # This matches ].push([...]) followed by )</script>
        $newContent = $newContent -replace '(?<=\.push\(\[[^\]].*?\])\)(?=</script>)', ']);'
        
        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($path, $newContent)
            Write-Host "Updated: $path"
        }
    } catch {
        Write-Error "Failed to process $path : $_"
    }
}
