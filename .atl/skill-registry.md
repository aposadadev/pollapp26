# Skill Registry — pollapp26

Generated: 2026-04-24
Project: pollapp26

## User-Level Skills (`~/.config/opencode/skills/`)

| Skill | Trigger |
|-------|---------|
| **branch-pr** | When creating a pull request, opening a PR, or preparing changes for review. |
| **issue-creation** | When creating a GitHub issue, reporting a bug, or requesting a feature. |
| **judgment-day** | When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". |
| **skill-creator** | When user asks to create a new skill, add agent instructions, or document patterns for AI. |
| **skill-registry** | When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills. |

> Note: `go-testing` skill is available but NOT relevant for this project (project stack is Nuxt/TypeScript, not Go).

## SDD Skills (orchestrated, do not call directly)

| Skill | Phase |
|-------|-------|
| **sdd-init** | Initialize SDD context |
| **sdd-explore** | Explore/investigate ideas before committing |
| **sdd-propose** | Create change proposal |
| **sdd-spec** | Write specifications |
| **sdd-design** | Technical design document |
| **sdd-tasks** | Implementation task breakdown |
| **sdd-apply** | Implement tasks from a change |
| **sdd-verify** | Validate implementation vs specs |
| **sdd-archive** | Sync delta specs and archive change |

## Project Conventions

- No AGENTS.md / CLAUDE.md / .cursorrules found at project root
- No project-level skills directory detected

## Stack Context (for skill selection)

- **Frontend**: Nuxt 4 SPA, Vue 3, TypeScript, Pinia, Nuxt UI, Tailwind CSS v4
- **Backend**: Firebase Cloud Functions (Node.js/TypeScript)
- **Database**: Cloud Firestore + VueFire
- **Testing**: Vitest 4.x (unit only), pnpm test/test:coverage
- **Quality**: ESLint 10 + vue-tsc
