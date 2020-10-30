import { NLU } from 'botpress/sdk'
import fse from 'fs-extra'
import { validate } from 'joi'

import { NLUConfigSchema } from './validation/schemas'

export const DEFAULT_LANG_SERVER = 'https://lang-01.botpress.io'
export const DEFAULT_DUCK_SERVER = 'https://duckling.botpress.io'
export const DEFAULT_LANG_SOURCES = [{ endpoint: DEFAULT_LANG_SERVER }]

const DEFAULT_CONFIG = <NLU.Config>{
  ducklingEnabled: true,
  ducklingURL: DEFAULT_DUCK_SERVER,
  languageSources: DEFAULT_LANG_SOURCES
}

export const getConfig = async (configFilePath: string | undefined): Promise<NLU.Config> => {
  if (!configFilePath) {
    return DEFAULT_CONFIG
  }

  const configFileContent = await fse.readFile(configFilePath, 'utf-8')
  const config: NLU.Config = await validate(JSON.parse(configFileContent), NLUConfigSchema, {
    stripUnknown: true
  })
  return config
}
