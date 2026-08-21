@echo off
setlocal

set "PIGGI_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "PIGGI_PRELOAD=%~dp0scripts\node-userinfo-fallback.cjs"
set "PIGGI_TSC=%~dp0node_modules\typescript\bin\tsc"

if not exist "%PIGGI_NODE%" (
  echo Piggi could not find the bundled Node.js runtime.
  echo Install Node.js LTS, then run: pnpm test and pnpm typecheck
  exit /b 1
)

if not exist "%~dp0node_modules\tsx\package.json" (
  echo Piggi's dependencies are not installed.
  echo Install them before running this check.
  exit /b 1
)

pushd "%~dp0" || exit /b 1

"%PIGGI_NODE%" --require "%PIGGI_PRELOAD%" --import tsx --test src\domain\pigProgress.test.mjs src\domain\authValidation.test.mjs src\data\cloudData.test.mjs src\state\piggiData.test.mjs
if errorlevel 1 (
  popd
  exit /b 1
)

"%PIGGI_NODE%" "%PIGGI_TSC%" --noEmit
set "PIGGI_CHECK_EXIT=%ERRORLEVEL%"

popd
exit /b %PIGGI_CHECK_EXIT%
