try {
    Invoke-Expression "node -v";
}
catch {
    Write-Error "NodeJS does not exist on your computer PATH.";
    exit 1;
}
Write-Host "installing npm modules...";
Invoke-Expression "npm install";
Write-Host "running lab1..."
Invoke-Expression "npm run start";
