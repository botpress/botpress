import * as sdk from '@botpress/sdk'
import { extractSpreadsheetId, extractGidFromUrl } from './utils'

interface SheetData {
  headers: string[]
  rows: string[][]
}

export class GoogleSheetsClient {
  constructor() {}

  private handleEscapedQuote(line: string, i: number, currentField: string): { newField: string; newIndex: number } {
    if (line[i + 1] === '"') {
      return { newField: currentField + '"', newIndex: i + 1 }
    }
    return { newField: currentField, newIndex: i }
  }

  private processCharacter(
    char: string,
    inQuotes: boolean,
    currentField: string,
    row: string[]
  ): { newField: string; shouldAddToRow: boolean } {
    if (char === ',' && !inQuotes) {
      row.push(currentField.trim())
      return { newField: '', shouldAddToRow: false }
    }
    return { newField: currentField + char, shouldAddToRow: false }
  }

  private parseCsvLine(line: string): string[] {
    const row: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes) {
          const { newField, newIndex } = this.handleEscapedQuote(line, i, currentField)
          currentField = newField
          i = newIndex
          if (newIndex === i) {
            inQuotes = !inQuotes
          }
        } else {
          inQuotes = !inQuotes
        }
      } else if (char !== undefined) {
        const { newField } = this.processCharacter(char, inQuotes, currentField, row)
        currentField = newField
      }
    }

    row.push(currentField.trim())
    return row
  }

  private parseCsv(csvText: string): string[][] {
    const lines = csvText.split('\n').filter((line) => line.trim() !== '')
    const result: string[][] = []

    for (const line of lines) {
      result.push(this.parseCsvLine(line))
    }

    return result
  }

  async getSheetData(sheetsUrl: string): Promise<SheetData> {
    const spreadsheetId = extractSpreadsheetId(sheetsUrl)
    const gid = extractGidFromUrl(sheetsUrl)

    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`

    const response = await fetch(csvUrl)

    if (!response.ok) {
      throw new sdk.RuntimeError(`Failed to fetch sheet data: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    if (!csvText.trim()) {
      return { headers: [], rows: [] }
    }

    const allRows = this.parseCsv(csvText)

    if (allRows.length === 0) {
      return { headers: [], rows: [] }
    }

    const headers = allRows[0] || []
    const rows = allRows.slice(1)

    return { headers, rows }
  }

  async validateAccess(sheetsUrl: string): Promise<boolean> {
    try {
      await this.getSheetData(sheetsUrl)
      return true
    } catch {
      return false
    }
  }
}
