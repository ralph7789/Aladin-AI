# Agent Changelog (Nebula) - `dev` branch

This file concisely tracks all system modifications and codebase changes made by the AI agent on the `dev` branch.

## [2026-08-01]
- **CI/CD Optimization**: Rewrote `.github/workflows/dev.yml` to build and push images directly to GitHub Container Registry (`ghcr.io`).
- **Deployment Script**: Updated `deploy-compose.yml` to automatically pull these lightweight GHCR images, preventing OOM build crashes on production servers.
