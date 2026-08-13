@echo off
chcp 65001 >nul
setlocal EnableExtensions

rem ==================================================================
rem DBY Label Pricing - LITE release
rem Danh cho sua UI, them cot va dieu chinh cong thuc nho.
rem Van tao NSIS EXE day du co chu ky (~3-4 MB), khong phai delta patch.
rem Usage: release-lite.bat [--local]
rem ==================================================================

cd /d "%~dp0"

if /I "%~1"=="--help" goto :help
if /I "%~1"=="-h" goto :help
if not "%~1"=="" if /I not "%~1"=="--local" goto :help

echo.
echo  DBY Label Pricing - RELEASE LITE
echo  Chi dung cho sua UI, them cot hoac dieu chinh cong thuc nho.
echo  Artifact updater day du co chu ky, dung luong thuong khoang 3-4 MB.
echo.

where node >nul 2>&1 || goto :missing_node
git rev-parse --is-inside-work-tree >nul 2>&1 || goto :not_git

node scripts\check-lite-release-scope.mjs || goto :blocked

echo.
echo Chuyen sang quy trinh build, ky va xac minh updater an toan...
call release-patch.bat %*
exit /b %ERRORLEVEL%

:blocked
echo.
echo RELEASE LITE da dung an toan, chua tang version va chua publish.
pause
exit /b 1

:missing_node
echo [ERROR] Khong tim thay Node.js.
pause
exit /b 1

:not_git
echo [ERROR] Day khong phai Git repository.
pause
exit /b 1

:help
echo.
echo Cach dung:
echo   release-lite.bat          Kiem tra pham vi va publish ban lite
echo   release-lite.bat --local  Chi tao EXE lite local, khong publish
echo.
echo Pham vi cho phep:
echo   - src\                     UI, cot, hien thi, cong thuc frontend
echo   - src-tauri\src\lib.rs     Cong thuc tinh gia Rust
echo.
echo Thay doi dependency, updater, quyen, cau hinh hoac ha tang release se bi chan.
exit /b 0

