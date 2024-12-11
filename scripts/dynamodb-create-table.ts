import * as dynamodb from '@aws-sdk/client-dynamodb'
import util from 'util'

const format = (x: any): string => util.inspect(x, { depth: null, colors: true })

const getEnv = (envName: string): string => {
  const envValue = process.env[envName]
  if (!envValue) {
    throw new Error(`${envName} is required`)
  }
  return envValue
}

const endpoint = getEnv('endpoint')
const table_name = getEnv('table_name')
const partition_key = getEnv('partition_key')
const sort_key = getEnv('sort_key')
const index_name = getEnv('index_name')
const index_sort_key = getEnv('index_sort_key')

console.info(`### endpoint=${endpoint} ###`)
console.info(`### table_name=${table_name} ###`)
console.info(`### partition_key=${partition_key} ###`)
console.info(`### sort_key=${sort_key} ###`)
console.info(`### index_name=${index_name} ###`)
console.info(`### index_sort_key=${index_sort_key} ###`)

const main = async () => {
  const ddbClient = new dynamodb.DynamoDBClient({
    endpoint,
  })

  const listTablesCmd = new dynamodb.ListTablesCommand({})
  const listTablesRes = await ddbClient.send(listTablesCmd)
  if (listTablesRes.TableNames?.includes(table_name)) {
    console.info(`Table ${table_name} already exists. Skipping creation.`)
    return
  }

  const createTableCmd = new dynamodb.CreateTableCommand({
    TableName: table_name,
    AttributeDefinitions: [
      {
        AttributeName: partition_key,
        AttributeType: 'S',
      },
      {
        AttributeName: sort_key,
        AttributeType: 'S',
      },
      {
        AttributeName: index_sort_key,
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: partition_key,
        KeyType: 'HASH',
      },
      {
        AttributeName: sort_key,
        KeyType: 'RANGE',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    LocalSecondaryIndexes: [
      {
        IndexName: index_name,
        KeySchema: [
          {
            AttributeName: partition_key,
            KeyType: 'HASH',
          },
          {
            AttributeName: index_sort_key,
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
      },
    ],
  })

  await ddbClient.send(createTableCmd)

  const describeTableCmd = new dynamodb.DescribeTableCommand({
    TableName: table_name,
  })

  const describeTableRes = await ddbClient.send(describeTableCmd)

  console.info('### Table Description ###')
  console.info(format(describeTableRes.Table))
}

void main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
