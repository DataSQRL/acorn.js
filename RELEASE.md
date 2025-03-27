# How to Release @datasqrl/acorn

## Prepare for release

### 1. Notify the team

Announce to the engineering team that you are releasing at least 1 day ahead of
time unless this is a scheduled release.

### 2. Ensure you are on the main branch

```bash
git checkout main
git pull
```

### 3. Update version number

Update the version number in `package.json`.

### 4. Test and build

Run tests and build to make sure everything is working:

```bash
npm test
npm run build
```

### 5. Commit changes

Create a commit with the message `Release {version}` and push:

```bash
git add package.json
git commit -m "Release {version}"
git push origin main
```

## Create GitHub Release

### 1. Go to GitHub Releases

Navigate to the repository's Releases
page: https://github.com/DataSQRL/acorn.js/releases

### 2. Draft a new release

Click "Create a new release" and fill in the following:

- Tag version: {version} (e.g., 1.2.0)
- Release title: {version}
- Description: List major changes, features, and bug fixes

### 3. Publish the release

Click "Publish release" to create the release.

## Automated Release Process

The repository has a GitHub Action workflow set up that automatically:

1. Triggers when a release is created in GitHub
2. Checks out the code
3. Sets up Node.js
4. Installs dependencies
5. Runs tests
6. Builds the package
7. Publishes to NPM

The workflow file is located at `.github/workflows/release.yml`.

## NPM Token Setup

For the automated release to work, you need to set up an NPM token:

1. Create an NPM access token with publish permissions
2. Add the token as a secret in your GitHub repository:
   - Go to Repository Settings > Secrets and variables > Actions
   - Add a new secret with name `NPM_TOKEN` and the token value

## Verify the release

### 1. Check NPM

Verify the package is published on
NPM: https://www.npmjs.com/package/@datasqrl/acorn

### 2. Install the new version

```bash
npm install @datasqrl/acorn@latest
```

### 3. Test in a project

Test the new version in a real project to confirm it works as expected.

### 4. Announce release completion

Announce that the release is complete.
