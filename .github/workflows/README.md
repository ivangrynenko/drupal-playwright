# Claude GitHub Actions

This repository includes two GitHub Actions for interacting with Claude AI:

## Available Workflows

### 1. Claude API Assistant (`claude-api.yml`)
A simple workflow that uses the Anthropic API directly to respond to requests in issues and comments.

**Features:**
- Responds to `@claude` mentions in issues and comments
- Posts Claude's response as a comment
- Can be triggered manually via workflow dispatch
- Uses Claude 3 Sonnet model

### 2. Claude Code (`claude-code.yml`) 
Full Claude Code integration for making code changes (Note: Currently being updated to work with Claude Code CLI).

## Setup

1. **Add your Anthropic API Key**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add a new secret named `ANTHROPIC_API_KEY` with your Anthropic API key

## Usage

### In Issues or Pull Requests

Simply include `@claude` followed by your request in:
- Issue body when creating a new issue
- Issue comments
- Pull request description
- Pull request review comments

**Examples:**
```
@claude add error handling to the install script

@claude refactor the playwright configuration to use environment variables

@claude write tests for the authentication helper
```

### Manual Trigger

You can also trigger Claude Code manually:
1. Go to Actions tab
2. Select "Claude Code" workflow
3. Click "Run workflow"
4. Enter your prompt
5. Click "Run workflow"

## How it Works

1. The action detects mentions of `@claude` in issues, PRs, or comments
2. Extracts the prompt after `@claude`
3. Runs Claude Code with the prompt
4. If changes are made:
   - For issues/comments: Creates a new pull request
   - For pull requests: Pushes changes to the same PR
5. Posts a comment with the result

## Permissions

The workflow runs with repository permissions and can:
- Read and write code
- Create pull requests
- Post comments
- Push to branches

## Best Practices

- Be specific in your requests to Claude
- Review all changes before merging
- Use pull request reviews for code changes
- For complex tasks, break them into smaller requests

## Troubleshooting

If the action doesn't trigger:
- Ensure `@claude` is included in your message
- Check that the `ANTHROPIC_API_KEY` secret is set
- Review the Actions tab for any error messages

## Security

- The Anthropic API key is stored as a GitHub secret
- The action only responds to authorized users with repository access
- All changes go through pull requests for review