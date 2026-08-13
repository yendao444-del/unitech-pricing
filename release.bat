@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ================================================================
rem Unitech Pricing - Release Windows + GitHub
rem Usage: release.bat v0.1.2
rem ================================================================

set "PROJECT_DIR=%~dp0"
set "RELEASE_TAG=%~1"
set "UPDATER_KEY=%LOCALAPPDATA%\UnitechPricing\updater\unitech-pricing.key"
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
set "TAURI_SIGNING_PRIVATE_KEY_PATH=%UPDATER_KEY%"

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

echo === 6/8 Dong goi installer EXE co chu ky updater ===
call npm run build:exe || goto :failed

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"
copy /Y "src-tauri\target\release\bundle\nsis\*.exe" "%RELEASE_DIR%\" >nul || goto :failed

echo === 7/8 Commit, push va tao Git tag ===
git add -A
git commit -m "chore(release): v%RELEASE_VERSION%" || goto :failed
git push origin main || goto :failed
git tag -a "v%RELEASE_VERSION%" -m "Unitech Pricing v%RELEASE_VERSION%" || goto :failed
git push origin "v%RELEASE_VERSION%" || goto :failed

echo === 8/8 Hoan tat ===
echo Installer local:
dir /b "%RELEASE_DIR%\*.exe" 2>nul
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
echo Cach dung: release.bat v0.1.2
echo Version phai tang so va theo dinh dang X.Y.Z.
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
