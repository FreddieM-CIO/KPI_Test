import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ExcelJS from 'exceljs'

const runtimePorts = {
  dev: { server: 4173, preview: 4273 },
  uat: { server: 4174, preview: 4274 },
  prod: { server: 4175, preview: 4275 },
}

const configDir = fileURLToPath(new URL('.', import.meta.url))
const workbookPath = path.resolve(configDir, '..', 'KPI_TEST_DASHBOARD.xlsx')

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

function evaluateWorkbookStatus(condition, target, actual) {
  if (condition === '>=') {
    return actual >= target ? 'Met' : 'Not Met'
  }
  if (condition === '<=') {
    return actual <= target ? 'Met' : 'Not Met'
  }
  return actual === target ? 'Met' : 'Not Met'
}

function calculateScorePct(target, actual) {
  if (target === 0) {
    return 0
  }
  return Number(((actual / target) * 100).toFixed(2))
}

function toHealthStatus(workbookStatus, scorePct) {
  if (workbookStatus === 'Not Met') {
    return scorePct >= 90 ? 'At Risk' : 'Off Track'
  }
  return scorePct >= 95 ? 'On Track' : 'At Risk'
}

async function readWorkbookRecords() {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(workbookPath)
  const sheet = workbook.worksheets[0]
  const headers = new Map()

  sheet.getRow(2).eachCell((cell, colNumber) => {
    headers.set(colNumber, String(cell.text ?? '').trim())
  })

  const rows = []
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const mappedRow = {}

    headers.forEach((header, colNumber) => {
      mappedRow[header] = String(row.getCell(colNumber).text ?? '').trim()
    })

    rows.push(mappedRow)
  }

  const updatedAt = fs.statSync(workbookPath).mtime.toISOString()

  const records = rows
    .filter((row) => row.Category && row.KPI)
    .map((row, index) => {
      const context = inferTeam(String(row.Category))
      const targetValue = Number(row['Target Value'])
      const actual = Number(row.Actual)
      const condition = String(row.Condition)
      const workbookStatus = evaluateWorkbookStatus(condition, targetValue, actual)
      const scorePct = calculateScorePct(targetValue, actual)

      return {
        id: `live-${String(index + 1).padStart(3, '0')}`,
        category: String(row.Category),
        kpi: String(row.KPI),
        targetDisplay: String(row['Target (Display)']),
        targetValue,
        condition,
        actual,
        scorePct,
        workbookStatus,
        status: toHealthStatus(workbookStatus, scorePct),
        notes: String(row.Notes ?? ''),
        team: context.team,
        owner: context.owner,
        frequency: context.frequency,
        lastUpdated: updatedAt.slice(0, 10),
      }
    })

  return {
    records,
    updatedAt,
    sourceFile: workbookPath,
  }
}

function devWorkbookPlugin(activeMode) {
  return {
    name: 'dev-workbook-live-sync',
    configureServer(server) {
      if (activeMode !== 'dev') {
        return
      }

      const normalizedWorkbookPath = path.normalize(workbookPath)
      server.watcher.add(normalizedWorkbookPath)

      server.watcher.on('change', (file) => {
        if (path.normalize(file) === normalizedWorkbookPath) {
          server.ws.send({
            type: 'custom',
            event: 'kpi-workbook-updated',
            data: { updatedAt: new Date().toISOString() },
          })
        }
      })

      server.middlewares.use('/api/dev/workbook-kpis', async (_req, res) => {
        try {
          const payload = await readWorkbookRecords()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Workbook sync failed.',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const activeMode = mode === 'uat' || mode === 'prod' ? mode : 'dev'
  const ports = runtimePorts[activeMode]

  return {
    plugins: [react(), devWorkbookPlugin(activeMode)],
    server: {
      host: '127.0.0.1',
      port: ports.server,
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: ports.preview,
      strictPort: true,
    },
  }
})
