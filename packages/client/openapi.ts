import { api as publicOpenapi } from '@botpress/api'

void publicOpenapi.exportClient('./src/gen', {
  generator: 'opapi',
})
