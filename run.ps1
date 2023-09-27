$directoryPath = ".\mupen64plus"
$downloadUrl = "https://github.com/mupen64plus/mupen64plus-core/releases/download/2.5.9/mupen64plus-bundle-win32-2.5.9.zip"
$zipPath = ".\mupen64plus-bundle-win32-2.5.9.zip"

# Check if directory exists
if (-Not (Test-Path $directoryPath)) {
    # Download ZIP file
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

    # Extract ZIP file
    Expand-Archive -Path $zipPath -DestinationPath $directoryPath

    # Remove ZIP file
    Remove-Item -Path $zipPath

    Write-Host "mupen64plus directory created and files extracted."
} else {
    Write-Host "mupen64plus directory already exists."
}

# Change working directory to mupen64plus
Set-Location -Path $directoryPath



# Run mupen64plus
.\mupen64plus-ui-console.exe --configdir ..\mupen_config ../mario64/mario64.n64
```

