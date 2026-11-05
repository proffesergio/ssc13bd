# Repository Guidelines

## Project Structure & Module Organization

This workspace currently contains no application source, tests, assets, or package manifests. The existing `.agents/`, `.codex/`, `.aws/`, and `.git/` directories are environment metadata; do not use them for application code or modify them without an explicit task requirement.

When introducing a project, document its entry points here. Prefer clear directories such as `src/` for source, `tests/` for tests, and `assets/` for static resources, unless the chosen framework requires another layout.

## Build, Test, and Development Commands

No build, development, lint, or test commands are configured yet. Do not assume commands such as `npm test` or `make build` work. When adding tooling, record the exact installation, local development, build, and verification commands in this guide and the project README.

For agent shell operations, follow `/home/billsbro/.codex/RTK.md` and prefix commands with `rtk`; for example, `rtk proxy rg --files --hidden` lists files, including hidden files.

## Coding Style & Naming Conventions

No language-specific style is established. Follow the selected language's standard conventions and keep indentation consistent within each file. Use descriptive names, keep modules focused, and configure a formatter and linter when introducing source code.

## Testing Guidelines

No test framework or coverage threshold exists. Add appropriate tests alongside new behavior, use descriptive test names, and document their location and execution command. Cover expected behavior, boundary cases, and relevant failure paths.

## Commit & Pull Request Guidelines

No usable Git history is available to establish commit conventions. Use concise, imperative commit subjects, such as `Add initial application structure`. Pull requests should explain the change, link relevant issues, and report verification results. Include screenshots for visible interface changes.

## Security & Configuration

Never commit credentials, tokens, or local configuration containing secrets. Provide placeholder configuration examples and document required environment variables when configuration is introduced.
