@echo off
setlocal

set "PIGGI_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "PIGGI_EXPO=%~dp0node_modules\expo\bin\cli"

if not exist "%PIGGI_NODE%" (
  echo Piggi could not find the bundled Node.js runtime.
  echo Install Node.js LTS from https://nodejs.org/ and then run: npm run start
  exit /b 1
)

if not exist "%PIGGI_EXPO%" (
  echo Piggi's dependencies are not installed.
  echo Open this project in Codex and ask it to install the dependencies.
  exit /b 1
)

"%PIGGI_NODE%" "%PIGGI_EXPO%" start %*

