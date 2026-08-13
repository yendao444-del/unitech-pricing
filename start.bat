@echo off
setlocal

title Unitech Pricing - Dev Server

set "PROJECT_DIR=%~dp0"
set "DEV_PORT=1420"

if not exist "%PROJECT_DIR%\package.json" (
  echo [ERROR] Khong tim thay project tai:
  echo         %PROJECT_DIR%
  pause
  exit /b 1
)

if not exist "%PROJECT_DIR%\node_modules" (
  echo [INFO] Chua co node_modules. Dang cai dependencies...
  pushd "%PROJECT_DIR%"
  call npm install --prefer-offline --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] Cai dependencies that bai.
    popd
    pause
    exit /b 1
  )
  popd
)

echo.
echo  Unitech Pricing - Dev mode (Hot Reload)
echo  Khoi dong ung dung desktop Tauri tai cong dev %DEV_PORT%.
echo  Nhan Ctrl+C de dung server.
echo.

rem Neu server dang chay, dung lai server do thay vi mo them mot tien trinh.
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %DEV_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  echo [INFO] Dev server da chay tren cong %DEV_PORT%.
  echo [WARN] Cong %DEV_PORT% dang duoc su dung. Hay dong tien trinh Tauri/Vite cu truoc.
  pause
  exit /b 0
)

pushd "%PROJECT_DIR%"
call npm run tauri dev
set "EXIT_CODE=%ERRORLEVEL%"
popd

echo.
echo Dev server da dung (exit code %EXIT_CODE%).
pause
exit /b %EXIT_CODE%
