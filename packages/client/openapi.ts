import { runtimeApi, adminApi, filesApi, tablesApi, api as publicApi } from '@botpress/api'

const options = {
  generator: 'opapi',
  ignoreDefaultParameters: true,
  ignoreSecurity: true,
} as const

void publicApi.exportClient('./src/gen/public', { generator: 'opapi' })
void runtimeApi.exportClient('./src/gen/runtime', options)
void adminApi.exportClient('./src/gen/admin', options)
void filesApi.exportClient('./src/gen/files', options)
void tablesApi.exportClient('./src/gen/tables', options)
