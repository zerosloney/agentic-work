: << 'CMDBLOCK'
:: Polyglot wrapper: runs .sh scripts cross-platform
:: Usage: run-hook.cmd <script-name> [args...]
::
:: Looks for bash in order:
::   1. %GIT_BASH% env var (user override)
::   2. where.exe bash (PATH resolution)
::   3. Common install paths

@echo off
if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "BASH="
if defined GIT_BASH set "BASH=%GIT_BASH%"
if not defined BASH for /f "delims=" %%i in ('where.exe bash 2^^>nul') do if not defined BASH set "BASH=%%i"
if not defined BASH if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if not defined BASH if exist "%LocalAppData%\Programs\Git\bin\bash.exe" set "BASH=%LocalAppData%\Programs\Git\bin\bash.exe"

if not defined BASH (
    echo run-hook.cmd: bash not found. Set GIT_BASH env var or install Git for Windows. >&2
    exit /b 1
)

"%BASH%" -l "%~dp0%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
"${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"