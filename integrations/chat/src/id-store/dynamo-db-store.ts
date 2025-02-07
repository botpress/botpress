import * as dynamodb from '@aws-sdk/client-dynamodb'
import { logger } from '../logger'
import * as errors from './errors'
import * as types from './types'

type DynamoDbMapProps = {
  botId: string

  tableName: string
  indexName: string | undefined
  partitionKey: string

  srcKeyName: string
  destKeyName: string
}

class DynamoDbMap implements types.IdMap {
  public constructor(
    protected _client: dynamodb.DynamoDBClient,
    private _props: DynamoDbMapProps
  ) {}

  public async find(src: string): Promise<string | undefined> {
    const { botId, tableName, indexName, partitionKey, srcKeyName, destKeyName } = this._props

    const { Items } = await this._client.send(
      new dynamodb.QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        ConsistentRead: true,
        KeyConditionExpression: `${partitionKey} = :bot_id AND ${srcKeyName} = :src`,
        ExpressionAttributeValues: {
          ':bot_id': { S: botId },
          ':src': { S: src },
        },
      })
    )

    const dest = Items?.[0]?.[destKeyName]?.S

    this._debug('find', src, dest ?? '∅')
    return dest
  }

  public async get(src: string): Promise<string> {
    const dest = await this.find(src)
    return dest ?? src
  }

  protected _debug = (operation: string, src: string, dest: string) => {
    if (this._props.indexName === undefined) {
      logger.debug(`${operation} ${src} -> ${dest}`)
    } else {
      logger.debug(`${operation} ${dest} <- ${src}`)
    }
  }
}

class IncomingDynamoDbMap extends DynamoDbMap implements types.IncomingIdMap {
  public constructor(
    client: dynamodb.DynamoDBClient,
    private _args: DynamoDbChatIdStoreProps
  ) {
    const { botId, tableName, partitionKey, sortKey, indexSortKey } = _args
    super(client, {
      botId,
      tableName,
      indexName: undefined,
      partitionKey,
      srcKeyName: sortKey,
      destKeyName: indexSortKey,
    })
  }

  public async set(fid: string, id: string): Promise<void> {
    const { botId, tableName, partitionKey: partitionKeyName, sortKey, indexSortKey } = this._args
    const createdAt = String(Date.now())

    await this._client
      .send(
        new dynamodb.PutItemCommand({
          TableName: tableName,
          Item: {
            [partitionKeyName]: { S: botId },
            [sortKey]: { S: fid },
            [indexSortKey]: { S: id },
            created_at: { N: createdAt },
          },
          ConditionExpression: `attribute_not_exists(${partitionKeyName}) AND attribute_not_exists(${sortKey})`,
        })
      )
      .catch((thrown) => {
        if (thrown instanceof dynamodb.ConditionalCheckFailedException) {
          throw new errors.IdAlreadyAssignedError(fid)
        }
        throw thrown
      })

    this._debug('set', fid, id)
  }

  public async delete(fid: string): Promise<void> {
    const { botId, tableName, partitionKey: partitionKeyName, sortKey } = this._args
    await this._client.send(
      new dynamodb.DeleteItemCommand({
        TableName: tableName,
        Key: {
          [partitionKeyName]: { S: botId },
          [sortKey]: { S: fid },
        },
      })
    )
  }
}

class OutgoingDynamoDbMap extends DynamoDbMap implements types.OutoingIdMap {
  public constructor(
    client: dynamodb.DynamoDBClient,
    private _args: DynamoDbChatIdStoreProps
  ) {
    const { botId, tableName, indexName, partitionKey, sortKey, indexSortKey } = _args
    super(client, {
      botId,
      tableName,
      indexName,
      partitionKey,
      srcKeyName: indexSortKey,
      destKeyName: sortKey,
    })
  }

  public async fetch(
    ids: string[]
  ): Promise<{ get: (id: string) => string; find: (id: string) => string | undefined }> {
    if (!ids.length) {
      return {
        find: () => undefined,
        get: (id) => id,
      }
    }

    const { botId, tableName, indexName, partitionKey, indexSortKey, sortKey } = this._args

    const uniqueIds = Array.from(new Set(ids))
    const whereIn = uniqueIds.map((id) => `'${id}'`).join(', ')

    // cannot perform a batch get operation on a secondary index, so we use PartiQl instead
    const { Items } = await this._client.send(
      new dynamodb.ExecuteStatementCommand({
        Statement: `SELECT ${indexSortKey}, ${sortKey} FROM "${tableName}"."${indexName}" WHERE ${partitionKey} = '${botId}' AND ${indexSortKey} IN (${whereIn})`,
      })
    )

    const entries: Record<string, string> = {}
    for (const item of Items ?? []) {
      const id = item[indexSortKey]?.S
      const fid = item[sortKey]?.S
      if (id !== undefined && fid !== undefined) {
        entries[id] = fid
      }
    }

    return {
      find: (id: string) => entries[id],
      get: (id: string) => {
        const fid = entries[id]
        return fid ?? id
      },
    }
  }
}

export type DynamoDbChatIdStoreProps = {
  botId: string
  tableName: string
  indexName: string
  partitionKey: string
  sortKey: string
  indexSortKey: string
}

export class DynamoDbChatIdStore implements types.ChatIdStore {
  public readonly byFid: types.IncomingIdMap
  public readonly byId: types.OutoingIdMap

  public constructor(client: dynamodb.DynamoDBClient, props: DynamoDbChatIdStoreProps) {
    this.byFid = new IncomingDynamoDbMap(client, props)
    this.byId = new OutgoingDynamoDbMap(client, props)
  }
}
