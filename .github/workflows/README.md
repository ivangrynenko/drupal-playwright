# Claude Code GitHub Action

This repository uses the official Claude Code Action to enable AI-powered code assistance directly in pull requests.

## Setup

1. **Add your Anthropic API Key**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add a new secret named `ANTHROPIC_API_KEY` with your Anthropic API key

## Usage

In any pull request comment, mention `@claude` followed by your request:

### Examples

```
@claude add error handling to this function

@claude write tests for the authentication module

@claude refactor this code to be more readable
```

## How it Works

1. When you comment on a pull request with `@claude`, the action triggers
2. Claude analyzes the pull request context and your request
3. Claude makes appropriate code changes
4. Changes are committed directly to the pull request branch
5. You can review and discuss the changes

## Features

- Full context awareness of the pull request
- Direct code modifications
- Automatic commits to the PR branch
- Works with any programming language

## Security

- The Anthropic API key is stored securely as a GitHub secret
- The action only responds to comments on pull requests
- All changes are visible in the pull request for review

## Official Documentation

This workflow uses the official Claude Code Action. For more information, see:
- [Claude Code Action](https://github.com/anthropics/claude-code-action)
- [Anthropic Documentation](https://docs.anthropic.com/)