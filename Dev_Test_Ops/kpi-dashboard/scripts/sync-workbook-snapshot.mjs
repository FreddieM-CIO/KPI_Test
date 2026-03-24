import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.resolve(projectRoot, 'src', 'data', 'kpiSnapshot.ts')
const workbookSources = {
  dev: path.resolve(projectRoot, '..', 'KPI_TEST_DASHBOARD - Dev.xlsx'),
  uat: path.resolve(projectRoot, '..', 'KPI_TEST_DASHBOARD - UAT.xlsx'),
  prod: path.resolve(projectRoot, '..', 'KPI_TEST_DASHBOARD.xlsx'),
}

function inferTeam(category) {
  if (category === 'Project Delivery') {
    return { team: 'PMO', owner: 'Jordan Kim', frequency: 'Weekly' }
  }
  if (category === 'Support Performance') {
    return { team: 'Service Desk', owner: 'Morgan Lee', frequency: 'Weekly' }
  }
  if (category === 'Asset Management') {
    return { team: 'Endpoint Ops', owner: 'Avery Patel', frequency: 'Biweekly' }
  }
  if (category === 'Technology & Advisory') {
    return { team: 'Architecture', owner: 'Riley Gomez', frequency: 'Monthly' }
  }
  return { team: 'Governance', owner: 'Sam Nguyen', frequency: 'Monthly' }
}

function escapeSingleQuoted(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function toTemplateLiteralValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

async function readWorkbookRows(workbookPath) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(workbookPath)
  const sheet = workbook.worksheets[0]
  const headers = new Map()

  sheet.getRow(2).eachCell((cell, columnNumber) => {
    headers.set(columnNumber, String(cell.text ?? '').trim())
  })

  const rows = []
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const sheetRow = sheet.getRow(rowNumber)
    const row = {}

    headers.forEach((header, columnNumber) => {
      row[header] = String(sheetRow.getCell(columnNumber).text ?? '').trim()
    })

    if (row.Category && row.KPI) {
      rows.push(row)
    }
  }

  const stats = await fs.stat(workbookPath)
  const lastUpdated = stats.mtime.toISOString().slice(0, 10)

  return { lastUpdated, rows }
}

function buildSnapshotSection(rows, lastUpdated) {
  const snapshotObjects = rows.map((row, index) => {
    const context = inferTeam(row.Category)
    return `    {
      id: 'kpi-${String(index + 1).padStart(3, '0')}',
      category: '${escapeSingleQuoted(row.Category)}',
      kpi: '${escapeSingleQuoted(row.KPI)}',
      targetDisplay: '${escapeSingleQuoted(row['Target (Display)'])}',
      targetValue: ${Number(row['Target Value'])},
      condition: '${escapeSingleQuoted(row.Condition)}',
      actual: ${Number(row.Actual)},
      scorePct: ${Number(row['Score (%)'])},
      workbookStatus: '${escapeSingleQuoted(row.Status)}',
      notes: '${escapeSingleQuoted(row.Notes ?? '')}',
      team: '${context.team}',
      owner: '${context.owner}',
      frequency: '${context.frequency}',
      lastUpdated: '${lastUpdated}',
    }`
  })

  const csvHeader = 'Category,KPI,Target (Display),Target Value,Condition,Actual,Score (%),Status,Notes'
  const csvRows = rows.map((row) =>
    [
      row.Category,
      row.KPI,
      row['Target (Display)'],
      row['Target Value'],
      row.Condition,
      row.Actual,
      row['Score (%)'],
      row.Status,
      row.Notes ?? '',
    ].join(','),
  )

  return {
    snapshot: snapshotObjects.join(',\n'),
    workbookCsvSnapshot: toTemplateLiteralValue([csvHeader, ...csvRows].join('\n')),
  }
}

function buildSnapshotFile(environmentData) {
  const environments = ['dev', 'uat', 'prod']
  const snapshotSections = environments
    .map((environment) => {
      const { rows, lastUpdated } = environmentData[environment]
      const section = buildSnapshotSection(rows, lastUpdated)
      return `  ${environment}: [
${section.snapshot}
  ],`
    })
    .join('\n')

  const csvSections = environments
    .map((environment) => {
      const { rows, lastUpdated } = environmentData[environment]
      const section = buildSnapshotSection(rows, lastUpdated)
      return `  ${environment}: \`${section.workbookCsvSnapshot}\`,`
    })
    .join('\n')

  return `import type { KpiRecord } from '../types/kpi'

export const kpiSnapshots: Record<'dev' | 'uat' | 'prod', Omit<KpiRecord, 'status'>[]> = {
${snapshotSections}
}

export const workbookCsvSnapshots: Record<'dev' | 'uat' | 'prod', string> = {
${csvSections}
}
`
}

async function main() {
  const environmentData = {
    dev: await readWorkbookRows(workbookSources.dev),
    uat: await readWorkbookRows(workbookSources.uat),
    prod: await readWorkbookRows(workbookSources.prod),
  }

  const fileContents = buildSnapshotFile(environmentData)
  await fs.writeFile(outputPath, fileContents, 'utf8')
  console.log(
    `Synced workbook rows into src/data/kpiSnapshot.ts (dev: ${environmentData.dev.rows.length}, uat: ${environmentData.uat.rows.length}, prod: ${environmentData.prod.rows.length})`,
  )
}

await main()
