import { runtimeApi, adminApi, filesApi, tablesApi, api as publicApi } from '@botpress/api'
void publicApi.exportClient('./src/gen/public', { generator: 'opapi' })
void runtimeApi.exportClient('./src/gen/runtime', { generator: 'opapi' })
void adminApi.exportClient('./src/gen/admin', { generator: 'opapi' })
void filesApi.exportClient('./src/gen/files', { generator: 'opapi' })
void tablesApi.exportClient('./src/gen/tables', { generator: 'opapi' })
