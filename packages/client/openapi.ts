import { api as publicOpenapi } from '@botpress/api'

const openapiGeneratorEndpoint = process.env.OPENAPI_GENERATOR_ENDPOINT ?? 'http://api.openapi-generator.tech'

void publicOpenapi.exportClient('./src/gen', openapiGeneratorEndpoint)
