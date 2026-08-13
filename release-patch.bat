@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

rem ==================================================================
rem Unitech Pricing - PATCH nhanh cho Tauri
rem - Tu tang patch version
rem - Chi build NSIS EXE (khong build MSI)
rem - Ky updater local, khong hoi password
rem - Tao GitHub Release truc tiep, khong kich hoat workflow build lai
rem Usage: release-patch.bat [--local]
rem ==================================================================

cd /d "%~dp0"

if /I "%~1"=="--help" goto :help
if /I "%~1"=="-h" goto :help

set "ENABLE_GITHUB=1"
if /I "%~1"=="--local" set "ENABLE_GITHUB=0"
set "PROJECT_DIR=%~dp0"
set "RELEASE_DIR=release"
set "UPDATER_DIR=%LOCALAPPDATA%\UnitechPricing\updater"
set "UPDATER_KEY=%UPDATER_DIR%\unitech-pricing.key"
set "UPDATER_PASSWORD_FILE=%UPDATER_DIR%\unitech-pricing.password"
set "VERSION_COMMITTED=0"

echo.
echo  Unitech Pricing - PATCH nhanh
echo  Chi dong goi NSIS EXE, khong build MSI va khong day source cho may cai.
echo.

where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
git rev-parse --is-inside-work-tree >nul 2>&1 || goto :not_git

if "%ENABLE_GITHUB%"=="1" (
  where gh >nul 2>&1 || goto :missing_gh
  gh auth status >nul 2>&1 || goto :gh_login
  git remote get-url origin >nul 2>&1 || goto :missing_remote
)

for /f "delims=" %%V in ('node -e "const c=require('./src-tauri/tauri.conf.json'); console.log(c.version)"') do set "CURRENT_VERSION=%%V"
for /f "delims=" %%V in ('node scripts\next-release-version.mjs') do set "RELEASE_VERSION=%%V"
if not defined CURRENT_VERSION goto :version_error
if not defined RELEASE_VERSION goto :version_error

set "RELEASE_TAG=patch-v%RELEASE_VERSION%"
set "PATCH_EXE_NAME=DBY.Label.Pricing_%RELEASE_VERSION%_x64-setup.exe"
set "PATCH_EXE=%RELEASE_DIR%\%PATCH_EXE_NAME%"
set "PATCH_SIG=%PATCH_EXE%.sig"
set "PATCH_MANIFEST=%RELEASE_DIR%\latest.json"

echo Version: v%CURRENT_VERSION% ^> v%RELEASE_VERSION%

if not exist "%UPDATER_KEY%" goto :missing_key
if not exist "%UPDATER_PASSWORD_FILE%" goto :missing_password

set "TAURI_SIGNING_PRIVATE_KEY_PATH="
set "TAURI_SIGNING_PRIVATE_KEY="
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="
set /p "TAURI_SIGNING_PRIVATE_KEY="<"%UPDATER_KEY%"
set /p "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<"%UPDATER_PASSWORD_FILE%"
if not defined TAURI_SIGNING_PRIVATE_KEY goto :missing_key
if not defined TAURI_SIGNING_PRIVATE_KEY_PASSWORD goto :missing_password

echo [1/5] Kiem tra source va dong bo version...
call npm run build || goto :rollback_fail
call npm run test:sites || goto :rollback_fail
call npm run check:rust || goto :rollback_fail
node scripts\set-release-version.mjs "%RELEASE_VERSION%" || goto :rollback_fail

echo [2/5] Build nhanh NSIS EXE...
set "BUILD_SIGNING_KEY=%TAURI_SIGNING_PRIVATE_KEY%"
set "BUILD_SIGNING_PASSWORD=%TAURI_SIGNING_PRIVATE_KEY_PASSWORD%"
set "TAURI_SIGNING_PRIVATE_KEY="
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD="
call npm run build:exe -- --no-sign --bundles nsis || goto :rollback_fail
set "TAURI_SIGNING_PRIVATE_KEY=%BUILD_SIGNING_KEY%"
set "TAURI_SIGNING_PRIVATE_KEY_PASSWORD=%BUILD_SIGNING_PASSWORD%"

set "BUILT_EXE=%PROJECT_DIR%src-tauri\target\release\bundle\nsis\DBY Label Pricing_%RELEASE_VERSION%_x64-setup.exe"
if not exist "%BUILT_EXE%" goto :missing_installer

echo [3/5] Ky updater va tao latest.json...
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"
del /q "%RELEASE_DIR%\*.exe" "%RELEASE_DIR%\*.msi" "%RELEASE_DIR%\*.sig" "%RELEASE_DIR%\latest.json" >nul 2>&1
copy /Y "%BUILT_EXE%" "%PATCH_EXE%" >nul || goto :rollback_fail
call npx tauri signer sign "%PATCH_EXE%" || goto :rollback_fail
if not exist "%PATCH_SIG%" goto :signature_error

powershell -NoProfile -Command "$sig = (Get-Content -LiteralPath '%PATCH_SIG%' -Raw).Trim(); $manifest = [ordered]@{ version = '%RELEASE_VERSION%'; notes = 'Unitech Pricing v%RELEASE_VERSION% - Patch'; pub_date = (Get-Date).ToUniversalTime().ToString('o'); platforms = [ordered]@{ 'windows-x86_64' = [ordered]@{ signature = $sig; url = 'https://github.com/yendao444-del/unitech-pricing/releases/download/%RELEASE_TAG%/%PATCH_EXE_NAME%' } } }; $json = $manifest | ConvertTo-Json -Depth 6; [System.IO.File]::WriteAllText('%PATCH_MANIFEST%', $json, (New-Object System.Text.UTF8Encoding($false)))" || goto :rollback_fail

if "%ENABLE_GITHUB%"=="0" goto :local_success

echo [4/5] Commit va push source...
git add -A
git commit -m "chore(patch): v%RELEASE_VERSION%" || goto :rollback_fail
set "VERSION_COMMITTED=1"
git push origin main || goto :fail_after_commit

echo [5/5] Tao GitHub Patch Release...
git tag -a "%RELEASE_TAG%" -m "Unitech Pricing patch v%RELEASE_VERSION%" || goto :fail_after_commit
git push origin "%RELEASE_TAG%" || goto :fail_after_commit
gh release create "%RELEASE_TAG%" "%PATCH_EXE%" "%PATCH_SIG%" "%PATCH_MANIFEST%" --repo yendao444-del/unitech-pricing --title "Unitech Pricing v%RELEASE_VERSION% (PATCH)" --notes "Patch - sua loi va thay doi nho." --latest --verify-tag || goto :fail_after_commit

echo.
echo  PATCH v%RELEASE_VERSION% DA PHAT HANH THANH CONG
echo  File production: %PATCH_EXE%
echo  https://github.com/yendao444-del/unitech-pricing/releases/tag/%RELEASE_TAG%
goto :success

:local_success
echo [4/5] Che do local: bo qua Git commit/push.
echo [5/5] Patch local da tao: %PATCH_EXE%
goto :success

:rollback_fail
if "%VERSION_COMMITTED%"=="0" (
  echo [WARN] Khoi phuc version v%CURRENT_VERSION%...
  node scripts\set-release-version.mjs "%CURRENT_VERSION%" >nul 2>&1
)
goto :failed

:fail_after_commit
echo [WARN] Source v%RELEASE_VERSION% da commit. Khong rollback version de tranh lech Git.
goto :failed

:missing_node
echo [ERROR] Khong tim thay Node.js.
goto :failed
:missing_npm
echo [ERROR] Khong tim thay npm.
goto :failed
:missing_gh
echo [ERROR] Khong tim thay GitHub CLI.
goto :failed
:gh_login
echo [ERROR] GitHub CLI chua dang nhap.
goto :failed
:missing_remote
echo [ERROR] Chua cau hinh Git remote origin.
goto :failed
:not_git
echo [ERROR] Day khong phai Git repository.
goto :failed
:version_error
echo [ERROR] Khong doc hoac tinh duoc version patch.
goto :failed
:missing_key
echo [ERROR] Thieu updater key: %UPDATER_KEY%
goto :failed
:missing_password
echo [ERROR] Thieu file mat khau updater: %UPDATER_PASSWORD_FILE%
goto :failed
:missing_installer
echo [ERROR] Khong tim thay NSIS EXE v%RELEASE_VERSION% sau khi build.
goto :rollback_fail
:signature_error
echo [ERROR] Khong tao duoc chu ky updater.
goto :rollback_fail

:help
echo.
echo Cach dung:
echo   release-patch.bat          Build va phat hanh patch len GitHub
echo   release-patch.bat --local  Chi build patch local, khong commit/push
echo   release-patch.bat --help   Hien huong dan nay
exit /b 0

:failed
echo.
echo PATCH that bai. Khong co GitHub Release moi duoc tao o buoc loi.
if not defined RELEASE_PATCH_NO_PAUSE pause
exit /b 1

:success
echo.
echo Thu muc release chi giu EXE patch moi nhat, .sig va latest.json.
if not defined RELEASE_PATCH_NO_PAUSE pause
exit /b 0
