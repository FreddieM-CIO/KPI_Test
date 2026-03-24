import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const versionsPath = path.resolve(projectRoot, 'src', 'config', 'environmentVersions.ts')
const environments = ['dev', 'uat', 'prod']
const versionPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/

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
  version: string
  updatedAt: string
  notes: string
}

export const environmentVersions: Record<AppEnvironment, EnvironmentVersionInfo> = {
  dev: {
    version: '${registry.dev.version}',
    updatedAt: '${registry.dev.updatedAt}',
    notes: '${escapeValue(registry.dev.notes)}',
  },
  uat: {
    version: '${registry.uat.version}',
    updatedAt: '${registry.uat.updatedAt}',
    notes: '${escapeValue(registry.uat.notes)}',
  },
  prod: {
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
    console.log(`${environment}: ${entry.version} | ${entry.updatedAt} | ${entry.notes}`)
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  const registry = await readVersionRegistry()

  if (command === 'show') {
    printRegistry(registry)
    return
  }

  if (command === 'set') {
    const [environment, version, ...notesParts] = args
    assertEnvironment(environment, 'Environment')
    if (!version) {
      throw new Error('Usage: set <environment> <version> [notes]')
    }
    assertVersion(version)
    registry[environment] = {
      version,
      updatedAt: today(),
      notes: notesParts.join(' ') || `Manual version update for ${environment}.`,
    }
    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  if (command === 'promote') {
    const [sourceEnvironment, targetEnvironment, ...notesParts] = args
    assertEnvironment(sourceEnvironment, 'Source environment')
    assertEnvironment(targetEnvironment, 'Target environment')
    registry[targetEnvironment] = {
      version: registry[sourceEnvironment].version,
      updatedAt: today(),
      notes:
        notesParts.join(' ') ||
        `Promoted from ${sourceEnvironment} on ${today()}.`,
    }
    await writeVersionRegistry(registry)
    printRegistry(registry)
    return
  }

  throw new Error(
    'Usage: show | set <environment> <version> [notes] | promote <sourceEnvironment> <targetEnvironment> [notes]',
  )
}

await main()
