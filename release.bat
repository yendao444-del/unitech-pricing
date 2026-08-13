@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ================================================================
rem Unitech Pricing - Release Windows + GitHub
rem Usage: release.bat [v0.1.2]
rem ================================================================

set "PROJECT_DIR=%~dp0"
set "RELEASE_TAG=%~1"
set "UPDATER_KEY=%LOCALAPPDATA%\UnitechPricing\updater\unitech-pricing.key"
set "UPDATER_PASSWORD_FILE=%LOCALAPPDATA%\UnitechPricing\updater\unitech-pricing.password"
set "RELEASE_DIR=release"

if "%~1"=="" (
  for /f "delims=" %%V in ('node scripts\next-release-version.mjs') do set "RELEASE_VERSION=%%V"
  if "!RELEASE_VERSION!"=="" (
    echo [ERROR] Khong the tu dong tao version moi.
    goto :failed
  )
  set "RELEASE_TAG=v!RELEASE_VERSION!"
) else (
  set "RELEASE_VERSION=%RELEASE_TAG:v=%"
)

echo.
echo  Unitech Pricing - Tao ban phat hanh %RELEASE_TAG%
echo  Version duoc tu dong tang theo patch.

powershell -NoProfile -Command "if ('%RELEASE_VERSION%' -match '^\d+\.\d+\.\d+$') { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [ERROR] Version khong hop le: %RELEASE_TAG%
  goto :usage
)

pushd "%PROJECT_DIR%"

echo.
echo === 1/8 Kiem tra Git ===
git rev-parse --is-inside-work-tree >nul 2>&1 || goto :not_git
git diff --quiet || echo [INFO] Co thay doi chua commit - se dua vao ban release nay.
git diff --cached --quiet || echo [INFO] Co thay doi da stage - se dua vao ban release nay.

echo === 2/8 Kiem tra khoa ky updater ===
if not exist "%UPDATER_KEY%" (
  echo [ERROR] Khong tim thay updater key tai:
  echo         %UPDATER_KEY%
  echo Khong the phat hanh ban cap nhat ma khong co khoa ky goc.
  goto :failed
)
if not exist "%UPDATER_PASSWORD_FILE%" (
  echo [ERROR] Khong tim thay file mat khau ky updater tai:
  echo         %UPDATER_PASSWORD_FILE%
  goto :failed
)
rem Chi truyen NOI DUNG private key. Khong truyen *_PATH, tranh Tauri mo luong
rem giai ma key cu va hoi Password khi key hien tai khong co mat khau.
set "TAURI_SIGNING_PRIVATE_KEY_PATH="
set "TAURI_SIGNING_PRIVATE_KEY="
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="
set /p "TAURI_SIGNING_PRIVATE_KEY="<"%UPDATER_KEY%"
set /p "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<"%UPDATER_PASSWORD_FILE%"
if not defined TAURI_SIGNING_PRIVATE_KEY (
  echo [ERROR] Khong doc duoc noi dung khoa ky updater.
  goto :failed
)
if not defined TAURI_SIGNING_PRIVATE_KEY_PASSWORD (
  echo [ERROR] Khong doc duoc mat khau ky updater tu file local.
  goto :failed
)

echo === 3/8 Cai dependencies neu can ===
if not exist "node_modules" (
  call npm ci || goto :failed
)

echo === 4/8 Build frontend va test ===
call npm run build || goto :failed
call npm run test:sites || goto :failed
call npm run check:rust || goto :failed

echo === 5/8 Dong bo version v%RELEASE_VERSION% ===
node scripts\set-release-version.mjs "%RELEASE_VERSION%" || goto :failed

echo === 6/8 Dong goi bo cai dat co chu ky updater ===
rem Build bo cai truoc, bo qua updater signing tu dong cua Tauri de khong bao gio
rem bat nguoi dung nhap Password tren console.
set "BUILD_SIGNING_KEY=%TAURI_SIGNING_PRIVATE_KEY%"
set "BUILD_SIGNING_PASSWORD=%TAURI_SIGNING_PRIVATE_KEY_PASSWORD%"
set "TAURI_SIGNING_PRIVATE_KEY="
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="
call npm run build:exe -- --no-sign || goto :failed
set "TAURI_SIGNING_PRIVATE_KEY=%BUILD_SIGNING_KEY%"
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD=%BUILD_SIGNING_PASSWORD%"

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"
rem Chi giu lai bo cai cua ban release hien tai, tranh thu muc release bi rac.
del /q "%RELEASE_DIR%\*.exe" "%RELEASE_DIR%\*.msi" "%RELEASE_DIR%\*.sig" "%RELEASE_DIR%\latest.json" >nul 2>&1
echo Dang gom toan bo file phat hanh vao "%RELEASE_DIR%"...
set "UPDATER_INSTALLER=%PROJECT_DIR%src-tauri\target\release\bundle\nsis\DBY Label Pricing_%RELEASE_VERSION%_x64-setup.exe"
if not exist "%UPDATER_INSTALLER%" (
  echo [ERROR] Khong tim thay installer NSIS sau khi build.
  goto :failed
)

rem Ky thu cong qua file tam khong co khoang trang; password duoc doc tu file
rem local o buoc 2, nen khong co prompt nhap tay.
set "SIGN_TEMP=%TEMP%\unitech-pricing-%RELEASE_VERSION%.exe"
copy /Y "%UPDATER_INSTALLER%" "%SIGN_TEMP%" >nul || goto :failed
call npx tauri signer sign "%SIGN_TEMP%" || goto :failed
if not exist "%SIGN_TEMP%.sig" (
  echo [ERROR] Khong tao duoc file chu ky updater .sig.
  goto :failed
)
copy /Y "%SIGN_TEMP%.sig" "%UPDATER_INSTALLER%.sig" >nul || goto :failed
del /q "%SIGN_TEMP%" "%SIGN_TEMP%.sig" >nul 2>&1

rem latest.json chi tro ve dung file EXE cua GitHub Release se duoc tao o buoc 7.
powershell -NoProfile -Command "$sig = (Get-Content -LiteralPath '%UPDATER_INSTALLER%.sig' -Raw).Trim(); $manifest = [ordered]@{ version = '%RELEASE_VERSION%'; notes = 'Unitech Pricing %RELEASE_TAG%'; pub_date = (Get-Date).ToUniversalTime().ToString('o'); platforms = [ordered]@{ 'windows-x86_64' = [ordered]@{ signature = $sig; url = 'https://github.com/yendao444-del/unitech-pricing/releases/download/%RELEASE_TAG%/DBY.Label.Pricing_%RELEASE_VERSION%_x64-setup.exe' } } }; $json = $manifest | ConvertTo-Json -Depth 6; [System.IO.File]::WriteAllText('%RELEASE_DIR%\latest.json', $json, (New-Object System.Text.UTF8Encoding($false)))" || goto :failed

copy /Y "%UPDATER_INSTALLER%" "%RELEASE_DIR%\" >nul || goto :failed
copy /Y "%UPDATER_INSTALLER%.sig" "%RELEASE_DIR%\" >nul || goto :failed

echo === 7/8 Commit, push va tao Git tag ===
git add -A
git commit -m "chore(release): v%RELEASE_VERSION%" || goto :failed
git push origin main || goto :failed
git tag -a "v%RELEASE_VERSION%" -m "Unitech Pricing v%RELEASE_VERSION%" || goto :failed
git push origin "v%RELEASE_VERSION%" || goto :failed

echo === 8/8 Hoan tat ===
echo Toan bo file phat hanh local:
dir /b "%RELEASE_DIR%" 2>nul
echo.
echo GitHub Actions dang tao release tu tag v%RELEASE_VERSION%.
echo https://github.com/yendao444-del/unitech-pricing/actions
echo https://github.com/yendao444-del/unitech-pricing/releases
popd
goto :success

:not_git
echo [ERROR] Thu muc nay chua duoc ket noi Git.
goto :failed

:usage
echo.
echo Cach dung: release.bat [v0.1.2]
echo Khong truyen version: tu dong tang patch. Chi truyen X.Y.Z khi can tang minor/major.
goto :failed

:failed
echo.
echo Release da dung an toan. Chua co tag/release nao duoc tao o buoc loi.
echo.
pause
exit /b 1

:success
echo.
echo Release da khoi dong thanh cong. Nhan phim bat ky de dong cua so nay.
echo.
pause
exit /b 0
