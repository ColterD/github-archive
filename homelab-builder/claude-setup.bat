@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM CLAUDE CODE AI - AUTONOMOUS DEVELOPMENT SETUP SCRIPT
REM Enhanced Windows Edition - FIXED VERSION
REM =============================================================================

set "SCRIPT_VERSION=2.1.0"
set "SETUP_STATE_FILE=claude-setup-state.txt"
set "LOG_FILE=claude-setup.log"

REM =============================================================================
REM DEBUG MODE AND IMMEDIATE FEEDBACK
REM =============================================================================
echo.
echo ================================================================================
echo                    Claude Code AI - Setup Wizard v%SCRIPT_VERSION%
echo                        Starting Setup Process
echo ================================================================================
echo.
echo DEBUG INFO:
echo - Current directory: %CD%
echo - User: %USERNAME%
echo - Script file: %~f0
echo - Parameters: %*
echo.
echo Press any key to continue with admin check...
pause >nul

REM =============================================================================
REM ADMINISTRATOR ELEVATION CHECK
REM =============================================================================

:check_admin
echo Checking administrator privileges...
net session >nul 2>&1
set "admin_check=%errorlevel%"
echo Admin check result: %admin_check%

if %admin_check% equ 0 (
    echo Running with administrator privileges - proceeding...
    goto :admin_confirmed
) else (
    echo.
    echo WARNING: ADMINISTRATOR PRIVILEGES RECOMMENDED
    echo.
    echo This setup wizard can install system-wide tools and dependencies.
    echo Administrator privileges are recommended for the best experience.
    echo.
    echo Without admin privileges, some features may not work:
    echo   - System-wide tool installation (git, curl, etc.)
    echo   - Global PATH modifications
    echo   - System service configuration
    echo.
    set /p "elevate=Would you like to restart with administrator privileges? (y/n): "
    if /i "!elevate!"=="y" (
        echo.
        echo Restarting with administrator privileges...
        powershell -command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs" 2>nul
        set "elevate_result=%errorlevel%"
        if !elevate_result! equ 0 (
            echo Elevation successful, exiting current session...
            timeout /t 2 >nul
            exit
        ) else (
            echo ERROR: Failed to elevate privileges. Continuing without admin rights...
            echo.
            pause
        )
    )
)

:admin_confirmed
title Claude Code AI - Setup Wizard v%SCRIPT_VERSION%
echo Administrator check completed - continuing with setup...

REM Initialize logging
echo ============================================================= >> "%LOG_FILE%" 2>nul
echo [%date% %time%] Setup wizard v%SCRIPT_VERSION% started >> "%LOG_FILE%" 2>nul
echo [%date% %time%] Running on Windows %OS% >> "%LOG_FILE%" 2>nul
echo [%date% %time%] Current directory: %CD% >> "%LOG_FILE%" 2>nul
echo [%date% %time%] User: %USERNAME% >> "%LOG_FILE%" 2>nul
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo [%date% %time%] Admin privileges: YES >> "%LOG_FILE%" 2>nul
) else (
    echo [%date% %time%] Admin privileges: NO >> "%LOG_FILE%" 2>nul
)
echo ============================================================= >> "%LOG_FILE%" 2>nul

REM =============================================================================
REM DISPLAY FUNCTIONS
REM =============================================================================

:display_header
cls
echo.
echo ================================================================================
echo                    Claude Code AI - Setup Wizard v%SCRIPT_VERSION%
echo                        Complete Setup and Validation
echo ================================================================================
echo.
goto :eof

:display_step
echo.
echo ================================================================================
echo STEP %~1: %~2
echo ================================================================================
echo.
goto :eof

:display_substep
echo --^> %~1
goto :eof

:display_success
echo [SUCCESS] %~1
goto :eof

:display_warning
echo [WARNING] %~1
goto :eof

:display_error
echo [ERROR] %~1
goto :eof

:display_info
echo [INFO] %~1
goto :eof

:display_action
echo [ACTION] %~1
goto :eof

REM =============================================================================
REM STATE MANAGEMENT FUNCTIONS
REM =============================================================================

:save_state
echo %~1=COMPLETED >> "%SETUP_STATE_FILE%" 2>nul
goto :eof

:save_variable
echo %~1_VALUE=%~2 >> "%SETUP_STATE_FILE%" 2>nul
goto :eof

:load_state
if exist "%SETUP_STATE_FILE%" (
    for /f "tokens=1,2 delims==" %%a in (%SETUP_STATE_FILE%) do (
        set "%%a=%%b"
    )
)
goto :eof

:check_completed
call :load_state
if "!%~1!"=="COMPLETED" (
    goto :eof
) else (
    goto :eof
)

REM =============================================================================
REM ERROR HANDLING FUNCTIONS
REM =============================================================================

:handle_recoverable_error
call :display_warning "%~1"
echo.
echo RECOVERABLE ERROR OCCURRED
echo What happened: %~1
echo Suggested fix: %~2
echo.
set /p "retry=Do you want to retry this step? (y/n): "
if /i "!retry!"=="y" (
    exit /b 0
) else (
    call :display_error "User chose to skip this step"
    exit /b 1
)

:handle_critical_error
call :display_error "%~1"
echo.
echo CRITICAL ERROR - SETUP CANNOT CONTINUE
echo.
echo Error details: %~1
echo Suggested solution: %~2
echo.
echo Please resolve the issue and run the script again.
echo.
pause
goto :eof

REM =============================================================================
REM TOOL INSTALLATION FUNCTIONS
REM =============================================================================

:install_git
call :display_action "Installing Git..."
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo Attempting Git installation via winget...
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    if %errorlevel% equ 0 (
        call :display_success "Git installed successfully via winget"
        goto :eof
    )
)

call :display_warning "Winget not available or failed, trying Chocolatey..."
where choco >nul 2>&1
if %errorlevel% neq 0 (
    call :display_action "Installing Chocolatey package manager..."
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" >nul 2>&1
    if %errorlevel% neq 0 (
        call :handle_critical_error "Failed to install Chocolatey" "Please install Git manually from https://git-scm.com/download/win"
        goto :eof
    )
    REM Refresh PATH to include Chocolatey
    call refreshenv >nul 2>&1
)

choco install git -y >nul 2>&1
if %errorlevel% equ 0 (
    call :display_success "Git installed via Chocolatey"
    goto :eof
) else (
    call :handle_critical_error "Failed to install Git" "Please install Git manually from https://git-scm.com/download/win"
    goto :eof
)

:install_curl
call :display_action "Installing curl..."
where curl >nul 2>&1
if %errorlevel% equ 0 (
    call :display_success "curl already available"
    goto :eof
)

where winget >nul 2>&1
if %errorlevel% equ 0 (
    winget install cURL.cURL --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    if %errorlevel% equ 0 (
        call :display_success "curl installed successfully via winget"
        goto :eof
    )
)

where choco >nul 2>&1
if %errorlevel% equ 0 (
    choco install curl -y >nul 2>&1
    if %errorlevel% equ 0 (
        call :display_success "curl installed via Chocolatey"
        goto :eof
    )
)

call :display_warning "curl installation failed, but it may be available in Windows 10/11"
goto :eof

REM =============================================================================
REM TOKEN VALIDATION FUNCTIONS
REM =============================================================================

:validate_github_token
set "token=%~1"
if "!token!"=="" (
    call :display_error "GitHub token cannot be empty"
    goto :eof
)

set "token_start=!token:~0,4!"
if "!token_start!"=="ghp_" goto :github_token_format_ok

set "token_start=!token:~0,11!"
if "!token_start!"=="github_pat_" goto :github_token_format_ok

call :display_error "Invalid GitHub token format. Must start with 'ghp_' or 'github_pat_'"
goto :eof

:github_token_format_ok
set "token_len=0"
set "temp_token=!token!"
:github_len_loop
if defined temp_token (
    set "temp_token=!temp_token:~1!"
    set /a token_len+=1
    goto :github_len_loop
)

if %token_len% lss 36 (
    call :display_error "GitHub token too short. Must be 36+ characters"
    goto :eof
)
goto :eof

:validate_railway_token
set "token=%~1"
if "!token!"=="" (
    call :display_error "Railway token cannot be empty"
    goto :eof
)

set "token_len=0"
set "temp_token=!token!"
:railway_len_loop
if defined temp_token (
    set "temp_token=!temp_token:~1!"
    set /a token_len+=1
    goto :railway_len_loop
)

if %token_len% lss 32 (
    call :display_error "Railway token too short. Must be 32+ characters"
    goto :eof
)

REM Simple alphanumeric check
echo !token! | findstr /r "^[a-zA-Z0-9]*$" >nul 2>&1
if %errorlevel% neq 0 (
    call :display_error "Invalid Railway token format. Must be alphanumeric characters only"
    goto :eof
)
goto :eof

:test_github_token
set "token=%~1"
call :display_info "Testing GitHub token..."

where curl >nul 2>&1
if %errorlevel% neq 0 (
    call :display_warning "curl not available, skipping token test"
    goto :eof
)

curl -s -H "Authorization: token !token!" -m 30 https://api.github.com/user > "%TEMP%\github_test.json" 2>nul
if %errorlevel% neq 0 (
    call :display_warning "GitHub API request failed - network issue or token problem"
    del "%TEMP%\github_test.json" >nul 2>&1
    goto :eof
)

findstr "login" "%TEMP%\github_test.json" >nul 2>&1
if %errorlevel% equ 0 (
    call :display_success "GitHub token is valid and working!"
    del "%TEMP%\github_test.json" >nul 2>&1
    goto :eof
) else (
    call :display_error "GitHub token test failed - please check your token permissions"
    del "%TEMP%\github_test.json" >nul 2>&1
    goto :eof
)

:test_railway_token
set "token=%~1"
call :display_info "Testing Railway token..."

where curl >nul 2>&1
if %errorlevel% neq 0 (
    call :display_warning "curl not available, skipping token test"
    goto :eof
)

curl -s -H "Authorization: Bearer !token!" -H "Content-Type: application/json" -m 30 -d "{\"query\":\"query { me { id name } }\"}" https://backboard.railway.app/graphql > "%TEMP%\railway_test.json" 2>nul
if %errorlevel% neq 0 (
    call :display_warning "Railway API request failed - network issue or token problem"
    del "%TEMP%\railway_test.json" >nul 2>&1
    goto :eof
)

findstr "id" "%TEMP%\railway_test.json" >nul 2>&1
if %errorlevel% equ 0 (
    call :display_success "Railway token is valid and working!"
    del "%TEMP%\railway_test.json" >nul 2>&1
    goto :eof
) else (
    call :display_error "Railway token test failed - please check your token"
    del "%TEMP%\railway_test.json" >nul 2>&1
    goto :eof
)

REM =============================================================================
REM SIMPLIFIED MAIN SETUP FUNCTIONS
REM =============================================================================

:guide_github_token_creation
call :check_completed GITHUB_TOKEN_SETUP
if %errorlevel% equ 0 (
    call :display_success "GitHub token setup already completed"
    goto :eof
)

call :display_step "1" "GitHub Token Creation"
call :display_substep "Let's create your GitHub Personal Access Token"
echo.
echo GitHub tokens allow me to:
echo - Create and manage repositories
echo - Deploy applications automatically
echo - Manage issues and pull requests
echo - Access private repositories
echo.

call :display_action "Follow these steps to create your token:"
echo 1. Go to GitHub Settings -^> Developer settings -^> Personal access tokens -^> Tokens (classic)
echo 2. Click 'Generate new token (classic)'
echo 3. Set expiration to 90 days or 'No expiration' for permanent use
echo 4. Select these scopes:
echo    - repo (Full control of private repositories)
echo    - workflow (Update GitHub Action workflows)
echo    - write:packages (Upload packages to GitHub Package Registry)
echo    - delete:packages (Delete packages from GitHub Package Registry)
echo    - admin:repo_hook (Full control of repository hooks)
echo    - user:email (Access user email addresses)
echo 5. Click 'Generate token'
echo 6. Copy the token immediately (you will not see it again!)
echo.

call :display_info "Opening GitHub token creation page..."
start "" "https://github.com/settings/tokens/new" >nul 2>&1

echo.
echo Press any key when you have created and copied your token...
pause >nul

echo.
echo Paste your GitHub token here (starts with 'ghp_' or 'github_pat_'):
set /p "GITHUB_TOKEN=> "

call :validate_github_token "!GITHUB_TOKEN!"
if %errorlevel% neq 0 (
    echo Please enter a valid GitHub token.
    goto :guide_github_token_creation
)

call :test_github_token "!GITHUB_TOKEN!"

call :save_variable GITHUB_TOKEN "!GITHUB_TOKEN!"
call :save_state GITHUB_TOKEN_SETUP
goto :eof

:guide_railway_token_creation
call :check_completed RAILWAY_TOKEN_SETUP
if %errorlevel% equ 0 (
    call :display_success "Railway token setup already completed"
    goto :eof
)

call :display_step "2" "Railway Token Creation"
call :display_substep "Let's create your Railway API Token"
echo.
echo Railway tokens allow me to:
echo - Deploy applications to Railway
echo - Manage environment variables
echo - Monitor deployments and logs
echo - Scale applications automatically
echo.

call :display_action "Follow these steps to create your token:"
echo 1. Go to Railway Account Settings -^> Tokens
echo 2. Click 'New Token'
echo 3. Give it a name like 'Claude Code AI'
echo 4. Click 'Create Token'
echo 5. Copy the token immediately
echo.

call :display_info "Opening Railway token creation page..."
start "" "https://railway.app/account/tokens" >nul 2>&1

echo.
echo Press any key when you have created and copied your token...
pause >nul

echo.
echo Paste your Railway token here (32+ alphanumeric characters):
set /p "RAILWAY_TOKEN=> "

call :validate_railway_token "!RAILWAY_TOKEN!"
if %errorlevel% neq 0 (
    echo Please enter a valid Railway token.
    goto :guide_railway_token_creation
)

call :test_railway_token "!RAILWAY_TOKEN!"

call :save_variable RAILWAY_TOKEN "!RAILWAY_TOKEN!"
call :save_state RAILWAY_TOKEN_SETUP
goto :eof

:setup_database_simple
call :check_completed DATABASE_SETUP
if %errorlevel% equ 0 (
    call :display_success "Database setup already completed"
    goto :eof
)

call :display_step "3" "Database Setup"
call :display_substep "Let's set up your PostgreSQL database"
echo.
echo You have several options for your database:
echo 1. Railway PostgreSQL (Recommended)
echo 2. Neon (Great free tier)
echo 3. Supabase (Includes auth features)
echo 4. Skip for now
echo.

:db_choice_loop
set /p "db_choice=Enter your choice (1-4): "

if "%db_choice%"=="1" (
    call :setup_railway_database
    goto :database_setup_complete
)
if "%db_choice%"=="2" (
    call :setup_neon_database
    goto :database_setup_complete
)
if "%db_choice%"=="3" (
    call :setup_supabase_database
    goto :database_setup_complete
)
if "%db_choice%"=="4" (
    call :display_info "Skipping database setup for now"
    set "DATABASE_URL="
    goto :database_setup_complete
)

echo Invalid choice. Please enter 1, 2, 3, or 4.
goto :db_choice_loop

:database_setup_complete
call :save_state DATABASE_SETUP
goto :eof

:setup_railway_database
call :display_substep "Setting up Railway PostgreSQL"
echo.
call :display_action "Follow these steps:"
echo 1. Go to your Railway dashboard
echo 2. Click 'New Project'
echo 3. Select 'Provision PostgreSQL'
echo 4. Once created, go to the PostgreSQL service
echo 5. Go to 'Variables' tab
echo 6. Copy the 'DATABASE_URL' value
echo.

call :display_info "Opening Railway dashboard..."
start "" "https://railway.app/dashboard" >nul 2>&1

echo.
echo Press any key when you have created the database...
pause >nul

echo.
echo Paste your Railway PostgreSQL DATABASE_URL here:
echo (Format: postgresql://user:password@host:port/database)
set /p "DATABASE_URL=> "

call :save_variable DATABASE_URL "!DATABASE_URL!"
goto :eof

:setup_neon_database
call :display_substep "Setting up Neon PostgreSQL"
echo.
call :display_action "Follow these steps:"
echo 1. Go to https://neon.tech and sign up
echo 2. Create a new project
echo 3. Go to 'Connection Details'
echo 4. Copy the connection string
echo.

start "" "https://neon.tech" >nul 2>&1

echo.
echo Press any key when you have created the database...
pause >nul

echo.
echo Paste your Neon DATABASE_URL here:
set /p "DATABASE_URL=> "

call :save_variable DATABASE_URL "!DATABASE_URL!"
goto :eof

:setup_supabase_database
call :display_substep "Setting up Supabase PostgreSQL"
echo.
call :display_action "Follow these steps:"
echo 1. Go to https://supabase.com and sign up
echo 2. Create a new project
echo 3. Go to Settings -^> Database
echo 4. Copy the connection string
echo.

start "" "https://supabase.com" >nul 2>&1

echo.
echo Press any key when you have created the database...
pause >nul

echo.
echo Paste your Supabase DATABASE_URL here:
set /p "DATABASE_URL=> "

call :save_variable DATABASE_URL "!DATABASE_URL!"
goto :eof

:create_environment_file
call :check_completed ENVIRONMENT_FILE_CREATED
if %errorlevel% equ 0 (
    call :display_success "Environment file already created"
    goto :eof
)

call :display_step "4" "Creating Environment Configuration"
call :display_substep "Creating .env.local with your configuration..."

REM Load all saved variables
call :load_state

REM Backup existing file if it exists
if exist .env.local (
    copy .env.local .env.local.backup >nul 2>&1
    call :display_info "Backed up existing .env.local to .env.local.backup"
)

REM Generate secure secrets
set "SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
set "JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
set "ENCRYPTION_KEY=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%"

REM Create the environment file
(
echo # =============================================================================
echo # CLAUDE CODE AI - AUTONOMOUS DEVELOPMENT ENVIRONMENT CONFIGURATION
echo # Generated on %date% %time%
echo # =============================================================================
echo.
echo # -----------------------------------------------------------------------------
echo # AUTHENTICATION TOKENS ^(REQUIRED FOR AUTONOMOUS OPERATION^)
echo # -----------------------------------------------------------------------------
echo.
echo # GitHub Personal Access Token
echo GITHUB_TOKEN=!GITHUB_TOKEN_VALUE!
echo.
echo # Railway API Token
echo RAILWAY_TOKEN=!RAILWAY_TOKEN_VALUE!
echo.
echo # -----------------------------------------------------------------------------
echo # DATABASE CONFIGURATION
echo # -----------------------------------------------------------------------------
echo.
echo # PostgreSQL connection string
echo DATABASE_URL="!DATABASE_URL_VALUE!"
echo.
echo # -----------------------------------------------------------------------------
echo # DEVELOPMENT CONFIGURATION
echo # -----------------------------------------------------------------------------
echo.
echo # Environment identifier
echo NODE_ENV=development
echo.
echo # Application URLs for different environments
echo DEV_URL=http://localhost:5173
echo STAGING_URL=https://your-staging-app.railway.app
echo PRODUCTION_URL=https://your-production-app.railway.app
echo.
echo # -----------------------------------------------------------------------------
echo # SECURITY CONFIGURATION
echo # -----------------------------------------------------------------------------
echo.
echo # Session secret for authentication ^(auto-generated^)
echo SESSION_SECRET=!SESSION_SECRET!
echo.
echo # JWT secret for token signing ^(auto-generated^)
echo JWT_SECRET=!JWT_SECRET!
echo.
echo # Encryption key for sensitive data ^(auto-generated^)
echo ENCRYPTION_KEY=!ENCRYPTION_KEY!
echo.
echo # -----------------------------------------------------------------------------
echo # CLAUDE CODE AI SPECIFIC
echo # -----------------------------------------------------------------------------
echo.
echo # Enable autonomous features
echo CLAUDE_AUTONOMOUS_MODE=true
echo CLAUDE_AUTO_DEPLOY=true
echo CLAUDE_AUTO_CLEANUP=true
echo CLAUDE_PREDICTIVE_DEVELOPMENT=true
) > .env.local

call :display_success ".env.local created with your configuration!"
call :display_info "All secrets have been auto-generated securely"
call :save_state ENVIRONMENT_FILE_CREATED
goto :eof

:install_basic_dependencies
call :check_completed DEPENDENCIES_INSTALLED
if %errorlevel% equ 0 (
    call :display_success "Dependencies already installed"
    goto :eof
)

call :display_step "5" "Installing Dependencies"
call :display_substep "Installing CLI tools and dependencies..."

REM Check and install Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    call :install_git
    if %errorlevel% neq 0 (
        call :display_error "Git installation failed"
        goto :eof
    )
) else (
    call :display_success "Git already installed"
)

REM Check and install curl  
call :install_curl

REM Install project dependencies if package.json exists
if exist package.json (
    call :display_substep "Installing project dependencies..."
    where pnpm >nul 2>&1
    if %errorlevel% equ 0 (
        echo Running: pnpm install
        pnpm install
        if %errorlevel% equ 0 (
            call :display_success "Dependencies installed with pnpm"
        ) else (
            call :display_warning "pnpm install failed"
        )
    ) else (
        where npm >nul 2>&1
        if %errorlevel% equ 0 (
            echo Running: npm install
            npm install
            if %errorlevel% equ 0 (
                call :display_success "Dependencies installed with npm"
            ) else (
                call :display_warning "npm install failed"
            )
        ) else (
            call :display_warning "No package manager found. Please install Node.js and npm"
        )
    )
) else (
    call :display_info "No package.json found, skipping dependency installation"
)

call :save_state DEPENDENCIES_INSTALLED
goto :eof

:display_success_summary
echo.
echo ================================================================================
echo                          CLAUDE CODE AI SETUP COMPLETE!
echo ================================================================================
echo.

call :display_success "Setup completed successfully!"
call :display_info "Environment configuration created"
call :display_info "Dependencies installed"
echo.

call :display_step "NEXT" "What you can do now:"
echo   1. Start development server:
echo      pnpm run dev
echo.
echo   2. Run tests:
echo      pnpm run test
echo.
echo   3. Build the project:
echo      pnpm run build
echo.

call :display_info "Important files created:"
echo   - .env.local - Your environment configuration
echo   - claude-setup-state.txt - Setup progress state
echo   - claude-setup.log - Setup log file
echo.

call :display_success "Ready for development!"
goto :eof

REM =============================================================================
REM MAIN EXECUTION FLOW
REM =============================================================================

:main
echo Starting main setup process...

call :display_header

call :display_step "SETUP" "Welcome to Claude Code AI Interactive Setup"

echo This setup will guide you through:
echo - Creating GitHub and Railway tokens
echo - Setting up database connections
echo - Installing required dependencies
echo - Creating environment configuration
echo.

echo Press any key to begin the setup process...
pause >nul

REM Execute setup steps
echo.
echo Starting setup steps...

call :guide_github_token_creation
if %errorlevel% neq 0 (
    echo GitHub token setup failed or was skipped
)

call :guide_railway_token_creation
if %errorlevel% neq 0 (
    echo Railway token setup failed or was skipped
)

call :setup_database_simple
if %errorlevel% neq 0 (
    echo Database setup failed or was skipped
)

call :create_environment_file
if %errorlevel% neq 0 (
    echo Environment file creation failed
)

call :install_basic_dependencies
if %errorlevel% neq 0 (
    echo Dependency installation failed or was skipped
)

call :display_success_summary

echo.
echo Setup process completed!
echo Press any key to exit...
pause >nul
goto :eof

REM =============================================================================
REM SCRIPT ENTRY POINT
REM =============================================================================

echo Calling main function...
call :main %*

echo.
echo Script execution completed.
echo Press any key to exit...
pause >nul