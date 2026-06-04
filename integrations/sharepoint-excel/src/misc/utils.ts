import * as sdk from '@botpress/sdk'

/**
 * Re-wraps a PEM private key into the standard 64-character-per-line format that
 * @azure/msal-node's clientCertificate.privateKey requires. Strips any existing
 * PEM headers/footers and whitespace before rebuilding the body.
 */
export const formatPrivateKey = (privateKey: string): string => {
  let cleanKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .trim()

  cleanKey = cleanKey.replace(/\s+/g, '')

  const lines: string[] = []
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.slice(i, i + 64))
  }

  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`
}

/**
 * Parses the sheetTableMapping input. Supports either a JSON object string
 * ('{"Sheet1":"table1"}') or comma-separated pairs ('Sheet1:table1,Sheet2:table2').
 * Throws a RuntimeError on malformed input.
 */
export const parseSheetTableMapping = (sheetTableMapping: string): Record<string, string> => {
  const sheetToTable: Record<string, string> = {}
  try {
    if (sheetTableMapping.trim().startsWith('{')) {
      const parsed = JSON.parse(sheetTableMapping) as Record<string, string>
      for (const [sheet, table] of Object.entries(parsed)) {
        const cleanSheet = String(sheet).trim()
        const cleanTable = String(table).trim()
        if (cleanSheet && cleanTable) {
          sheetToTable[cleanSheet] = cleanTable
        }
      }
    } else {
      sheetTableMapping.split(',').forEach((pair) => {
        const [sheet, table] = pair.split(':').map((s) => s.trim())
        if (sheet && table) {
          sheetToTable[sheet] = table
        }
      })
    }
  } catch {
    throw new sdk.RuntimeError('Invalid sheetTableMapping format. Use JSON or comma-separated pairs.')
  }

  if (Object.keys(sheetToTable).length === 0) {
    throw new sdk.RuntimeError('Invalid sheetTableMapping format. Use JSON or comma-separated pairs.')
  }

  return sheetToTable
}

export type ColumnType = 'string' | 'number'

/**
 * Auto-detects the column type for a single column given all of its data values.
 * A column is 'number' only if at least one non-empty value exists AND every
 * non-empty value parses as a finite number; otherwise it defaults to 'string'.
 */
export const detectColumnType = (values: unknown[]): ColumnType => {
  let isNumeric = true
  let hasData = false

  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      hasData = true
      if (isNaN(Number(value))) {
        isNumeric = false
        break
      }
    }
  }

  return hasData && isNumeric ? 'number' : 'string'
}

/**
 * Coerces a single cell value according to the target column type.
 * - number columns: Number(value), falling back to the original value if NaN;
 *   empty cells become null.
 * - string columns: String(value); empty cells become ''.
 */
export const coerceValue = (value: unknown, columnType: ColumnType): string | number | null => {
  const isEmpty = value === undefined || value === null || value === ''

  if (columnType === 'number') {
    if (isEmpty) {
      return null
    }
    const numValue = Number(value)
    return isNaN(numValue) ? (value as number) : numValue
  }

  return isEmpty ? '' : String(value)
}
