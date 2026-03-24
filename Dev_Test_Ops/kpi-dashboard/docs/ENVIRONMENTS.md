# Environment Strategy

## Runtime Environments
- `dev`: fast feedback for active development and workbook/data-mapping validation
- `uat`: business validation and signoff before release
- `prod`: live dashboard for operational reporting

## Environment Files
- `.env.dev`
- `.env.uat`
- `.env.prod`
- `src/config/environmentVersions.ts`

The React app reads the active environment from `VITE_ENVIRONMENT` and shows it in the page header.

## Environment Version Control
- Each environment has a tracked version entry in `src/config/environmentVersions.ts`
- Version format is `baseVersion-environment.revision`
- Revisions are tied to the git history of `Dev_Test_Ops/kpi-dashboard`
- The dashboard header shows the active environment version and release date
- Use `npm run version:show` to inspect the current version map
- Use `npm run hooks:install` once to enable automatic commit-time versioning
- Every dashboard commit auto-updates the current environment version through the git pre-commit hook
- Every promotion auto-updates the target environment version in the promotion script
- Use `npm run version:base -- all 1.1.0 "Major release"` when you want to change the shared base version intentionally

## Localhost URLs
- `dev`: `http://127.0.0.1:4173`
- `uat`: `http://127.0.0.1:4174`
- `prod`: `http://127.0.0.1:4175`

## Local Launch Commands
- `npm run local:dev`
- `npm run local:uat`
- `npm run local:prod`
- `npm run local:start-all`
- `npm run local:stop-all`

## Local Preview Commands
- `npm run build:dev` then `npm run preview:dev` at `http://127.0.0.1:4273`
- `npm run build:uat` then `npm run preview:uat` at `http://127.0.0.1:4274`
- `npm run build:prod` then `npm run preview:prod` at `http://127.0.0.1:4275`

## Troubleshooting
- If the browser shows "site can’t be reached", start the servers first with `npm run local:start-all`
- Logs are written under `.local-runtime`
- Stop all local environments with `npm run local:stop-all`
- For dev workbook live sync details, see `docs/DEV_REALTIME_SYNC.md`

## Promotion Flow
1. Create feature branches from `dev`.
2. Open a pull request into `dev` to validate changes in the `dev` environment.
3. Set or update the `dev` release version after validation.
4. After team review, copy the `dev` release version into `uat` and promote the exact tested commit from `dev` to `uat`.
5. Business users validate in `uat` and sign off.
6. Copy the approved `uat` release version into `prod` and promote the same approved commit from `uat` into `main`.

## Branch-to-Environment Mapping
- `dev` branch deploys to `dev`
- `uat` branch deploys to `uat`
- `main` branch deploys to `prod`

## GitHub Actions Flow
- `ci.yml` runs lint, tests, and build checks for code quality
- `promote.yml` builds the correct environment bundle and attaches it to the matching GitHub Environment
- GitHub Environment approvals should be enabled for `uat` and `prod`
- `docs/BRANCH_PROMOTION.md` documents the local fast-forward promotion process

## Recommended Protection Rules
1. Require pull requests into `dev`, `uat`, and `main`
2. Require status checks from `CI`
3. Require reviewer approval for `uat`
4. Require business/ops approval for `prod`

## Example Promotion Commands
```powershell
git checkout dev
git pull
git checkout -b feature/kpi-refresh

# open PR into dev
# after validation:
git checkout uat
git merge --ff-only dev

# after UAT signoff:
git checkout main
git merge --ff-only uat
```
