import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const sourceWorkbookPath = path.resolve(projectRoot, '..', 'KPI_TEST_DASHBOARD - Dev.xlsx')
const targetWorkbookPath = path.resolve(projectRoot, '..', 'KPI_TEST_DASHBOARD - UAT.xlsx')
const sourceKeyColumns = ['Category', 'KPI']

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeKey(row) {
  return sourceKeyColumns.map((column) => normalizeText(row[column]).toLowerCase()).join('::')
}

function cloneCellValue(value) {
  if (value === null || value === undefined) {
    return value
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value))
  }
  return value
}

function cloneStyle(style) {
  return JSON.parse(JSON.stringify(style ?? {}))
}

function isBlankValue(value) {
  if (value === null || value === undefined) {
    return true
  }
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  if (typeof value === 'object' && 'richText' in value) {
    return !value.richText?.some((part) => normalizeText(part?.text))
  }
  return false
}

function getHeaders(sheet) {
  const headers = []
  sheet.getRow(2).eachCell((cell, columnNumber) => {
    headers.push({
      columnNumber,
      name: normalizeText(cell.text),
    })
  })
  return headers.filter((header) => header.name)
}

function getRowByHeaders(sheetRow, headers) {
  const row = {}
  for (const header of headers) {
    row[header.name] = normalizeText(sheetRow.getCell(header.columnNumber).text)
  }
  return row
}

function buildTargetIndex(sheet, headers) {
  const index = new Map()
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = getRowByHeaders(sheet.getRow(rowNumber), headers)
    const key = normalizeKey(row)
    if (key !== '::') {
      index.set(key, rowNumber)
    }
  }
  return index
}

function copyCell(sourceCell, targetCell) {
  targetCell.value = cloneCellValue(sourceCell.value)
  targetCell.style = cloneStyle(sourceCell.style)
  if (sourceCell.numFmt) {
    targetCell.numFmt = sourceCell.numFmt
  }
}

async function main() {
  const sourceWorkbook = new ExcelJS.Workbook()
  const targetWorkbook = new ExcelJS.Workbook()

  await sourceWorkbook.xlsx.readFile(sourceWorkbookPath)
  await targetWorkbook.xlsx.readFile(targetWorkbookPath)

  const sourceSheet = sourceWorkbook.worksheets[0]
  const targetSheet = targetWorkbook.worksheets[0]
  const sourceHeaders = getHeaders(sourceSheet)
  const targetHeaders = getHeaders(targetSheet)

  const sourceHeaderMap = new Map(sourceHeaders.map((header) => [header.name, header.columnNumber]))
  const targetHeaderMap = new Map(targetHeaders.map((header) => [header.name, header.columnNumber]))

  for (const keyColumn of sourceKeyColumns) {
    if (!sourceHeaderMap.has(keyColumn) || !targetHeaderMap.has(keyColumn)) {
      throw new Error(`Missing required key column "${keyColumn}" in one of the workbooks.`)
    }
  }

  const targetIndex = buildTargetIndex(targetSheet, targetHeaders)
  let appendedRows = 0
  let filledCells = 0

  for (let rowNumber = 3; rowNumber <= sourceSheet.rowCount; rowNumber += 1) {
    const sourceRow = sourceSheet.getRow(rowNumber)
    const sourceData = getRowByHeaders(sourceRow, sourceHeaders)
    const key = normalizeKey(sourceData)

    if (key === '::') {
      continue
    }

    const targetRowNumber = targetIndex.get(key)
    if (!targetRowNumber) {
      const newRowNumber = targetSheet.rowCount + 1
      const newRow = targetSheet.getRow(newRowNumber)
      newRow.height = sourceRow.height

      for (const header of sourceHeaders) {
        const targetColumnNumber = targetHeaderMap.get(header.name)
        if (!targetColumnNumber) {
          continue
        }

        copyCell(sourceRow.getCell(header.columnNumber), newRow.getCell(targetColumnNumber))
      }

      newRow.commit()
      targetIndex.set(key, newRowNumber)
      appendedRows += 1
      continue
    }

    const targetRow = targetSheet.getRow(targetRowNumber)
    for (const header of sourceHeaders) {
      const targetColumnNumber = targetHeaderMap.get(header.name)
      if (!targetColumnNumber) {
        continue
      }

      const sourceCell = sourceRow.getCell(header.columnNumber)
      const targetCell = targetRow.getCell(targetColumnNumber)

      if (!isBlankValue(sourceCell.value) && isBlankValue(targetCell.value)) {
        copyCell(sourceCell, targetCell)
        filledCells += 1
      }
    }

    targetRow.commit()
  }

  if (appendedRows > 0 || filledCells > 0) {
    await targetWorkbook.xlsx.writeFile(targetWorkbookPath)
  }

  console.log(
    JSON.stringify({
      sourceWorkbookPath,
      targetWorkbookPath,
      appendedRows,
      filledCells,
      changed: appendedRows > 0 || filledCells > 0,
    }),
  )
}

await main()
