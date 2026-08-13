param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedVersion,
  [string]$Endpoint = "https://github.com/yendao444-del/unitech-pricing/releases/latest/download/latest.json",
  [string]$Tag = ""
)

$ErrorActionPreference = "Stop"
$ExpectedVersion = $ExpectedVersion.TrimStart("v")
$projectDir = Split-Path -Parent $PSScriptRoot
$tempDir = Join-Path ([IO.Path]::GetTempPath()) ("dby-updater-check-" + [Guid]::NewGuid().ToString("N"))
$manifestPath = Join-Path $tempDir "latest.json"
$installerPath = Join-Path $tempDir "installer.exe"

New-Item -ItemType Directory -Path $tempDir | Out-Null
try {
  $verified = $false
  for ($attempt = 1; $attempt -le 6; $attempt++) {
    try {
      if ($Tag) {
        $token = $env:GH_TOKEN
        if (-not $token) { $token = gh auth token }
        if (-not $token) { throw "GitHub token is required to verify draft assets" }
        $headers = @{
          Authorization = "Bearer $token"
          Accept = "application/vnd.github+json"
          "X-GitHub-Api-Version" = "2022-11-28"
        }
        # GitHub's "release by tag" endpoint returns 404 while a release is still
        # a draft. Query the authenticated release list so the pre-publish gate
        # can inspect the draft before it becomes visible to production.
        $releases = Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/yendao444-del/unitech-pricing/releases?per_page=100"
        $release = $releases | Where-Object { $_.tag_name -eq $Tag } | Select-Object -First 1
        if (-not $release) { throw "Cannot find GitHub release for tag $Tag" }
        $manifestAsset = $release.assets | Where-Object { $_.name -eq "latest.json" } | Select-Object -First 1
        $expectedInstallerName = "DBY.Label.Pricing_${ExpectedVersion}_x64-setup.exe"
        $installerAsset = $release.assets | Where-Object { $_.name -eq $expectedInstallerName } | Select-Object -First 1
        if (-not $manifestAsset -or -not $installerAsset) { throw "Draft release is missing updater assets" }
        $assetHeaders = $headers.Clone()
        $assetHeaders.Accept = "application/octet-stream"
        Invoke-WebRequest -UseBasicParsing -Headers $assetHeaders $manifestAsset.url -OutFile $manifestPath
        Invoke-WebRequest -UseBasicParsing -Headers $assetHeaders $installerAsset.url -OutFile $installerPath
      } else {
        Invoke-WebRequest -UseBasicParsing ($Endpoint + "?verify=" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -OutFile $manifestPath
      }
      $manifestBytes = [IO.File]::ReadAllBytes($manifestPath)
      if ($manifestBytes.Length -ge 3 -and $manifestBytes[0] -eq 0xEF -and $manifestBytes[1] -eq 0xBB -and $manifestBytes[2] -eq 0xBF) {
        throw "latest.json contains a UTF-8 BOM"
      }

      $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
      if ($manifest.version -ne $ExpectedVersion) {
        throw "Expected version $ExpectedVersion, got $($manifest.version)"
      }

      $downloadUrl = $manifest.platforms.'windows-x86_64'.url
      if (-not $downloadUrl) {
        throw "Missing platforms.windows-x86_64.url"
      }

      if (-not $Tag) {
        Invoke-WebRequest -UseBasicParsing $downloadUrl -OutFile $installerPath
      }
      cargo run --quiet --manifest-path (Join-Path $projectDir "scripts\updater-verifier\Cargo.toml") -- $manifestPath $installerPath (Join-Path $projectDir "src-tauri\tauri.conf.json") $ExpectedVersion
      if ($LASTEXITCODE -ne 0) {
        throw "Cryptographic updater verification failed"
      }

      $verified = $true
      break
    } catch {
      if ($attempt -eq 6) { throw }
      Start-Sleep -Seconds 5
    }
  }

  if (-not $verified) { throw "Updater verification did not complete" }
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
