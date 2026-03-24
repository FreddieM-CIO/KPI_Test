import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const versionsPath = path.resolve(projectRoot, 'src', 'config', 'environmentVersions.ts')
const gitBinary = existsSync('C:\\Program Files\\Git\\cmd\\git.exe')
  ? 'C:\\Program Files\\Git\\cmd\\git.exe'
  : 'git'
const repoRoot = runGit(['-C', projectRoot, 'rev-parse', '--show-toplevel'])
const projectGitPath = 'Dev_Test_Ops/kpi-dashboard'
const environments = ['dev', 'uat', 'prod']
const environmentBranchMap = {
  dev: 'dev',
  uat: 'uat',
  prod: 'main',
}
const versionPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/

function runGit(args) {
  return execFileSync(gitBinary, args, {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim()
}

function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function assertEnvironment(value, label) {
  if (!environments.includes(value)) {
    throw new Error(`${label} must be one of: ${environments.join(', ')}`)
  }
}

function assertVersion(value) {
  if (!versionPattern.test(value)) {
    throw new Error(`Version "${value}" must look like 1.2.3 or 1.2.3-rc.1`)
  }
}

function branchToEnvironment(branch) {
  if (branch === 'main') {
    return 'prod'
  }
  if (branch === 'uat') {
    return 'uat'
  }
  return 'dev'
}

function getBranchName(environment) {
  return environmentBranchMap[environment]
}

function getCommitCount(branch) {
  return Number(runGit(['-C', repoRoot, 'rev-list', '--count', branch, '--', projectGitPath]))
}

function buildVersion(baseVersion, environment, revision) {
  return `${baseVersion}-${environment}.${revision}`
}

async function readVersionRegistry() {
  const source = await fs.readFile(versionsPath, 'utf8')
  const match = source.match(
    /export const environmentVersions: Record<AppEnvironment, EnvironmentVersionInfo> = (\{[\s\S]*\})/,
  )

  if (!match) {
    throw new Error('Could not parse environmentVersions.ts')
  }

  return Function(`"use strict"; return (${match[1]})`)()
}

function buildVersionFile(registry) {
  return `import type { AppEnvironment } from './appConfig'

export interface EnvironmentVersionInfo {
  baseVersion: string
  revision: number
  version: string
  updatedAt: string
  notes: string
}

export const environmentVersions: Record<AppEnvironment, EnvironmentVersionInfo> = {
  dev: {
    baseVersion: '${registry.dev.baseVersion}',
    revision: ${registry.dev.revision},
    version: '${registry.dev.version}',
    updatedAt: '${registry.dev.updatedAt}',
    notes: '${escapeValue(registry.dev.notes)}',
  },
  uat: {
    baseVersion: '${registry.uat.baseVersion}',
    revision: ${registry.uat.revision},
    version: '${registry.uat.version}',
    updatedAt: '${registry.uat.updatedAt}',
    notes: '${escapeValue(registry.uat.notes)}',
  },
  prod: {
    baseVersion: '${registry.prod.baseVersion}',
    revision: ${registry.prod.revision},
    version: '${registry.prod.version}',
    updatedAt: '${registry.prod.updatedAt}',
    notes: '${escapeValue(registry.prod.notes)}',
  },
}
`
}

function escapeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function writeVersionRegistry(registry) {
  await fs.writeFile(versionsPath, buildVersionFile(registry), 'utf8')
}

function printRegistry(registry) {
  for (const environment of environments) {
    const entry = registry[environment]
    console.log(
      `${environment}: ${entry.version} | base ${entry.baseVersion} | revision ${entry.revision} | ${entry.updatedAt} | ${entry.notes}`,
    )
  }
}

function touchEntry(registry, environment, notes, baseVersionOverride) {
  const baseVersion = baseVersionOverride ?? registry[environment].baseVersion
  const revision = getCommitCount(getBranchName(environment)) + 1

  registry[environment] = {
    baseVersion,
    revision,
    version: buildVersion(baseVersion, environment, revision),
    updatedAt: today(),
    notes,
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  const registry = await readVersionRegistry()

  if (command === 'show') {
    printRegistry(registry)
    return
  }

  if (command === 'set-base') {
    const [environment, baseVersion, ...notesParts] = args
    if (!environment || !baseVersion) {
      throw new Error('Usage: set-base <environment|all> <baseVersion> [notes]')
    }

    assertVersion(baseVersion)

    if (environment === 'all') {
      for (const env of environments) {
        touchEntry(
          registry,
          env,
          notesParts.join(' ') || `Base version updated to ${baseVersion}.`,
          baseVersion,
        )
      }
    } else {
      assertEnvironment(environment, 'Environment')
      touchEntry(
        registry,
        environment,
        notesParts.join(' ') || `Base version updated to ${baseVersion}.`,
        baseVersion,
      )
    }

    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  if (command === 'touch') {
    const [environment, ...notesParts] = args
    assertEnvironment(environment, 'Environment')
    touchEntry(
      registry,
      environment,
      notesParts.join(' ') || `Tracked change on ${environment}.`,
    )
    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  if (command === 'touch-branch') {
    const currentBranch = runGit(['-C', repoRoot, 'branch', '--show-current'])
    const environment = branchToEnvironment(currentBranch)
    touchEntry(
      registry,
      environment,
      args.join(' ') || `Tracked change on branch ${currentBranch}.`,
    )
    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  if (command === 'promote') {
    const [sourceEnvironment, targetEnvironment, ...notesParts] = args
    assertEnvironment(sourceEnvironment, 'Source environment')
    assertEnvironment(targetEnvironment, 'Target environment')

    touchEntry(
      registry,
      targetEnvironment,
      notesParts.join(' ') ||
        `Promoted ${registry[sourceEnvironment].version} from ${sourceEnvironment} to ${targetEnvironment}.`,
      registry[sourceEnvironment].baseVersion,
    )

    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  throw new Error(
    'Usage: show | set-base <environment|all> <baseVersion> [notes] | touch <environment> [notes] | touch-branch [notes] | promote <sourceEnvironment> <targetEnvironment> [notes]',
  )
}

await main()
