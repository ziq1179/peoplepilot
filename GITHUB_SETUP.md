# How to Push Your Application to GitHub

Follow these steps to push your PeoplePilot application to GitHub.

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Install with default settings
   - Restart your terminal/command prompt after installation

2. **Create a GitHub Account** (if you don't have one):
   - Go to: https://github.com
   - Sign up for a free account

## Step 1: Initialize Git Repository (if not already done)

Open your terminal in the project directory and run:

```bash
cd "C:\Users\ZafarIqbal\Documents\people\PeoplePilot (1)\PeoplePilot"
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: PeoplePilot HRIS application"
```

## Step 4: Create a GitHub Repository

1. Go to https://github.com and log in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `PeoplePilot` (or any name you prefer)
   - **Description**: "HRIS (Human Resources Information System) application"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 5: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/PeoplePilot.git

# Verify the remote was added
git remote -v
```

## Step 6: Push to GitHub

```bash
# Push to GitHub (first time)
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (or personal access token).

## Step 7: Set Up Authentication (if needed)

If you get authentication errors, you may need to use a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes: `repo` (full control of private repositories)
4. Copy the token
5. Use the token as your password when pushing

## Future Updates

After making changes to your code:

```bash
# Check what files changed
git status

# Add changed files
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Important Notes

⚠️ **Security**: The `.gitignore` file has been updated to exclude:
- `.env` files (contains database credentials and secrets)
- `node_modules/` (dependencies)
- Build outputs and temporary files

**Never commit**:
- `.env` files
- Database credentials
- API keys
- Session secrets

## Troubleshooting

### Git not found
- Make sure Git is installed and added to your system PATH
- Restart your terminal after installing Git

### Authentication failed
- Use a Personal Access Token instead of password
- Make sure you have the correct repository URL

### Push rejected
- If the repository already has files, you may need to pull first:
  ```bash
  git pull origin main --allow-unrelated-histories
  git push -u origin main
  ```

## Repository Structure

Your repository will include:
- ✅ Source code (client/, server/, shared/)
- ✅ Configuration files (package.json, tsconfig.json, etc.)
- ✅ Documentation (README.md, setup guides)
- ❌ `.env` files (excluded for security)
- ❌ `node_modules/` (excluded - can be reinstalled with `npm install`)

## Next Steps

After pushing to GitHub:
1. Add a README.md with project description
2. Add a LICENSE file if needed
3. Set up GitHub Actions for CI/CD (optional)
4. Add collaborators if working in a team

