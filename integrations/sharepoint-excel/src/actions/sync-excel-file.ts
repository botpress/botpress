import { Client } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import * as xlsx from 'xlsx'
import { getSharepointClient } from '../client'
import { coerceValue, detectColumnType, parseSheetTableMapping, type ColumnType } from '../misc/utils'
import * as bp from '.botpress'

// Table operations require the vanilla @botpress/client exposed via client._inner.
const getVanillaClient = (client: bp.Client): Client => client._inner

const BATCH_SIZE = 50

type TableProperties = Record<string, { type: string }>
type ProcessedSheet = { sheetName: string; tableName: string; rowCount: number }

const syncExcelFile: bp.IntegrationProps['actions']['syncExcelFile'] = async (props) => {
  const { ctx, input, logger } = props
  const config = ctx.configuration

  logger.forBot().info(`Starting Excel file sync for bot: ${ctx.botId}`)
  logger.forBot().info(`Syncing Excel file: "${input.sharepointFileUrl}"`)
  logger.forBot().info(`Using sheetTableMapping: ${input.sheetTableMapping}`)

  const spClient = getSharepointClient(config)
  const botpressVanillaClient = getVanillaClient(props.client)

  const sheetToTable = parseSheetTableMapping(input.sheetTableMapping)
  const sheetsToProcess = Object.keys(sheetToTable)
  logger.forBot().info(`Parsed sheetTableMapping: ${JSON.stringify(sheetToTable)}`)

  // Fetch the workbook. A null result means "not found" -> list the available
  // document libraries to help the user correct their file URL.
  const fileContentBuffer = await spClient.getFileContentByUrl(input.sharepointFileUrl)
  if (!fileContentBuffer) {
    logger.forBot().warn('File not found. Listing available document libraries to help diagnose the issue...')
    const libraries = await spClient.listDocumentLibraries()
    logger.forBot().info(`Available document libraries in site "${config.siteName}":`)
    for (const lib of libraries) {
      logger.forBot().info(`- ${lib.name} (Web URL: ${lib.webUrl})`)
    }
    throw new sdk.RuntimeError(
      `File not found at "${input.sharepointFileUrl}". Ensure the file URL matches one of the document libraries listed above.`
    )
  }
  logger.forBot().info('Successfully fetched Excel file content.')

  const workbook = xlsx.read(fileContentBuffer, { type: 'buffer' })
  logger
    .forBot()
    .info(`Excel workbook loaded with ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`)

  const missingSheets = sheetsToProcess.filter((sheet) => !workbook.SheetNames.includes(sheet))
  if (missingSheets.length > 0) {
    throw new sdk.RuntimeError(
      `Sheets not found in workbook: ${missingSheets.join(', ')}. Available sheets: ${workbook.SheetNames.join(', ')}`
    )
  }

  const processedSheets: ProcessedSheet[] = []

  for (const currentSheetName of sheetsToProcess) {
    logger.forBot().info(`--- Processing sheet: "${currentSheetName}" ---`)

    const worksheet = workbook.Sheets[currentSheetName]
    if (!worksheet) {
      logger.forBot().warn(`Sheet "${currentSheetName}" is undefined, skipping`)
      continue
    }

    const jsonData = xlsx.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })
    logger.forBot().info(`Sheet "${currentSheetName}" has ${jsonData.length} rows (including header)`)

    if (jsonData.length === 0) {
      logger.forBot().warn(`Sheet "${currentSheetName}" is empty, skipping`)
      continue
    }

    const excelHeaders = (jsonData[0] ?? []) as unknown[]
    if (excelHeaders.length === 0) {
      logger.forBot().warn(`Sheet "${currentSheetName}" has no header row, skipping`)
      continue
    }

    const rowsData = jsonData.slice(1) as unknown[][]
    logger.forBot().info(`Found ${rowsData.length} data rows in sheet "${currentSheetName}"`)

    const tableNameForSheet = sheetToTable[currentSheetName] as string
    logger.forBot().info(`Using mapped table name: "${tableNameForSheet}" for sheet "${currentSheetName}"`)

    // Build the desired schema from the sheet by auto-detecting column types.
    const properties: TableProperties = {}
    for (const [index, header] of excelHeaders.entries()) {
      const cleanHeader = String(header).trim()
      if (!cleanHeader) {
        continue
      }
      const columnType = detectColumnType(rowsData.map((row) => row[index]))
      properties[cleanHeader] = { type: columnType }
      logger.forBot().debug(`Column "${cleanHeader}" detected as type: ${columnType}`)
    }

    if (Object.keys(properties).length === 0) {
      throw new sdk.RuntimeError(
        `No valid headers found in sheet "${currentSheetName}" after cleaning. Cannot create table schema.`
      )
    }

    // getOrCreateTable preserves the table (and therefore any KB links) if it
    // already exists; it only creates the table the first time. The returned
    // schema is authoritative for type coercion (existing tables are not altered).
    const { table } = await botpressVanillaClient.getOrCreateTable({
      table: tableNameForSheet,
      schema: { type: 'object', properties },
    })
    const tableSchemaProperties = table.schema.properties as Record<string, { type?: string } | undefined>
    logger.forBot().info(`Table "${tableNameForSheet}" (ID: ${table.id}) ready.`)

    // Clear existing rows while preserving the table itself (KB links stay intact).
    try {
      await botpressVanillaClient.deleteTableRows({ table: tableNameForSheet, deleteAllRows: true })
      logger.forBot().info(`Cleared existing rows from table "${tableNameForSheet}".`)
    } catch (deleteError) {
      const deleteErrorMsg = deleteError instanceof Error ? deleteError.message : `${deleteError}`
      logger
        .forBot()
        .warn(
          `Could not clear rows from table "${tableNameForSheet}" (${deleteErrorMsg}). Preserving table to maintain ` +
            'KB links; proceeding with insert. This may result in duplicate data.'
        )
    }

    // Pair each header with its cell value for a single row, coercing to the
    // table's column type. Empty/missing headers are skipped.
    const zip = (headers: unknown[], values: unknown[]): Record<string, string | number | null> => {
      const rowObject: Record<string, string | number | null> = {}
      headers.forEach((header, index) => {
        const cleanHeader = String(header).trim()
        if (!cleanHeader) {
          return
        }
        const columnType: ColumnType = tableSchemaProperties[cleanHeader]?.type === 'number' ? 'number' : 'string'
        rowObject[cleanHeader] = coerceValue(values[index], columnType)
      })
      return rowObject
    }

    const rowsToInsert = rowsData
      .map((rowArray) => zip(excelHeaders, rowArray))
      .filter((obj) => Object.keys(obj).length > 0)

    if (rowsToInsert.length === 0) {
      if (rowsData.length > 0) {
        logger
          .forBot()
          .warn(`Data rows were present in sheet "${currentSheetName}", but no valid rows could be constructed`)
      } else {
        logger.forBot().info(`No data rows to populate in sheet "${currentSheetName}"`)
      }
      processedSheets.push({ sheetName: currentSheetName, tableName: tableNameForSheet, rowCount: 0 })
      continue
    }

    logger
      .forBot()
      .info(`Populating table "${tableNameForSheet}" (ID: ${table.id}) with ${rowsToInsert.length} new rows.`)

    const totalRows = rowsToInsert.length
    let insertedRows = 0
    while (insertedRows < totalRows) {
      const batch = rowsToInsert.slice(insertedRows, insertedRows + BATCH_SIZE)
      await botpressVanillaClient.createTableRows({ table: tableNameForSheet, rows: batch })
      insertedRows += batch.length
      logger.forBot().info(`Processed ${insertedRows}/${totalRows} rows for table "${tableNameForSheet}"`)
    }

    logger.forBot().info(`Successfully populated table "${tableNameForSheet}" with ${rowsToInsert.length} rows`)
    processedSheets.push({ sheetName: currentSheetName, tableName: tableNameForSheet, rowCount: rowsToInsert.length })
  }

  logger.forBot().info('--- Excel file sync completed ---')
  logger.forBot().info(`Processed ${processedSheets.length} sheet(s) successfully`)

  return { processedSheets }
}

export default syncExcelFile
