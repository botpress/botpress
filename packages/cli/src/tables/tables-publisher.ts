import * as sdk from '@botpress/sdk'
import * as apiUtils from '../api'
import * as errors from '../errors'
import * as logger from '../logger'
import * as utils from '../utils'
import * as schemas from './schemas'

export class TablesPublisher {
  private readonly _api: apiUtils.ApiClient
  private readonly _logger: logger.Logger
  private readonly _prompt: utils.prompt.CLIPrompt

  public constructor({
    api,
    logger,
    prompt,
  }: {
    api: apiUtils.ApiClient
    logger: logger.Logger
    prompt: utils.prompt.CLIPrompt
  }) {
    this._api = api
    this._logger = logger
    this._prompt = prompt
  }

  public async deployTables({ botId, botDefinition }: { botId: string; botDefinition: sdk.BotDefinition }) {
    const api = this._api.switchBot(botId)

    this._logger.log('Synchronizing tables...')

    const tablesFromBotDef = Object.entries(botDefinition.tables ?? {})
    const { tables: existingTables } = await api.client.listTables({})

    for (const [tableName, tableDef] of tablesFromBotDef) {
      const existingTable = existingTables.find((t) => t.name === tableName)

      this._logger.log(`Deploying table "${tableName}"...`)

      if (existingTable) {
        await this._deployExistingTable({ api, existingTable, updatedTableDef: tableDef })
      } else {
        await this._deployNewTable({ api, tableName, tableDef })
      }
    }

    for (const existingTable of existingTables) {
      if (!tablesFromBotDef.find(([tableName]) => tableName === existingTable.name)) {
        this._logger.log(
          `Table "${existingTable.name}" was previously defined but is not present in your bot definition. ` +
            'This table will be ignored. ' +
            'If you wish to delete this table, you may do so from the studio.'
        )
      }
    }
  }

  private async _deployExistingTable({
    api,
    existingTable,
    updatedTableDef,
  }: {
    api: apiUtils.ApiClient
    existingTable: Awaited<ReturnType<apiUtils.ApiClient['client']['listTables']>>['tables'][number]
    updatedTableDef: sdk.BotTableDefinition
  }) {
    if (existingTable.frozen) {
      this._logger.warn(`Table "${existingTable.name}" is frozen and will not be updated.`)
      return
    }

    const existingColumns = existingTable.schema.properties
    const updatedColumns = await this._parseTableColumns({ tableName: existingTable.name, tableDef: updatedTableDef })

    for (const [columnName, existingColumn] of Object.entries(existingColumns)) {
      const updatedColumn = updatedColumns[columnName]

      if (!updatedColumn) {
        const wishToContinue = await this._warnAndConfirm(
          `Column "${columnName}" is missing from the schema of table "${existingTable.name}" in your bot definition. ` +
            'If you are attempting to rename this column, please do so from the studio. ' +
            'Renaming a column in your bot definition will cause a new column to be created. ' +
            'If this is not a rename and you wish to proceed, the old column will be kept unchanged. ' +
            'You can delete columns from the studio if you no longer need them.'
        )

        // TODO: ask the user whether this is a rename. If it is a rename, list
        //       all other columns and ask which one has the new name, then do
        //       the rename operation with client.renameTableColumn()

        if (!wishToContinue) {
          return
        }
      }

      if (updatedColumn && existingColumn.type !== updatedColumn.type) {
        const wishToContinue = await this._warnAndConfirm(
          'DATA LOSS WARNING: ' +
            `Type of column "${columnName}" has changed from "${existingColumn.type}" to "${updatedColumn.type}" in table "${existingTable.name}". ` +
            'If you proceed, the value of this column will be reset to NULL for all rows in the table.'
        )

        if (!wishToContinue) {
          return
        }
      }
    }

    await api.client.updateTable({
      table: existingTable.name,
      schema: updatedTableDef.schema.toJsonSchema(),
      frozen: updatedTableDef.frozen,
      tags: updatedTableDef.tags,
      isComputeEnabled: updatedTableDef.isComputeEnabled,
    })

    this._logger.success(`Table "${existingTable.name}" has been updated`)
  }

  private async _parseTableColumns({
    tableName,
    tableDef,
  }: {
    tableName: string
    tableDef: sdk.BotTableDefinition
  }): Promise<Record<string, sdk.z.infer<typeof schemas.columnSchema>>> {
    type JSONObjectSchema = sdk.JSONSchema & {
      properties: {
        [key: string]: sdk.JSONSchema
      }
    }

    const columns = (tableDef.schema.toJsonSchema() as JSONObjectSchema).properties

    const validColumns = await Promise.all(
      Object.entries(columns).map(async ([columnName, columnSchema]) => {
        const validatedSchema = await schemas.columnSchema.safeParseAsync(columnSchema)

        if (!validatedSchema.success) {
          throw new errors.BotpressCLIError(
            `Column "${columnName}" in table "${tableName}" has an invalid schema: ${validatedSchema.error.message}`
          )
        }

        return [columnName, validatedSchema.data] as const
      })
    )

    return Object.fromEntries(validColumns)
  }

  private async _warnAndConfirm(warningMessage: string, confirmMessage: string = 'Are you sure you want to continue?') {
    this._logger.warn(warningMessage)

    const confirm = await this._prompt.confirm(confirmMessage)

    if (!confirm) {
      this._logger.log('Aborted')
      return false
    }
    return true
  }

  private async _deployNewTable({
    api,
    tableName,
    tableDef,
  }: {
    api: apiUtils.ApiClient
    tableName: string
    tableDef: sdk.BotTableDefinition
  }) {
    await api.client.createTable({
      name: tableName,
      schema: tableDef.schema.toJsonSchema(),
      frozen: tableDef.frozen,
      tags: tableDef.tags,
      factor: tableDef.factor,
      isComputeEnabled: tableDef.isComputeEnabled,
    })

    this._logger.success(`Table "${tableName}" has been created`)
  }
}
