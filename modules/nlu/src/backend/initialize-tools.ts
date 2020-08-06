import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import { DucklingEntityExtractor } from './entities/duckling_extractor'
import LangProvider from './language/language-provider'
import { getPOSTagger, tagSentence } from './language/pos-tagger'
import { LanguageProvider, NLUHealth, NLUVersionInfo, Token2Vec, Tools } from './typings'

const NLU_VERSION = '1.2.2'

const healthGetter = (languageProvider: LanguageProvider) => (): NLUHealth => {
  const { validProvidersCount, validLanguages } = languageProvider.getHealth()
  return {
    isEnabled: validProvidersCount > 0 && validLanguages.length > 0,
    validProvidersCount,
    validLanguages
  }
}

const versionGetter = (languageProvider: LanguageProvider) => (): NLUVersionInfo => {
  return {
    nluVersion: NLU_VERSION,
    langServerInfo: languageProvider.langServerInfo
  }
}

const initializeLanguageProvider = async (bp: typeof sdk) => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  try {
    const languageProvider = await LangProvider.initialize(globalConfig.languageSources, bp.logger, NLU_VERSION)
    const getHealth = healthGetter(languageProvider)
    return { languageProvider, health: getHealth() }
  } catch (e) {
    if (e.failure && e.failure.code === 'ECONNREFUSED') {
      bp.logger.error(`Language server can't be reached at address ${e.failure.address}:${e.failure.port}`)
      if (!process.IS_FAILSAFE) {
        process.exit()
      }
    }
    throw e
  }
}

const initDucklingExtractor = async (bp: typeof sdk): Promise<void> => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)
}

export async function initializeTools(bp: typeof sdk): Promise<Tools> {
  await initDucklingExtractor(bp)
  const { languageProvider } = await initializeLanguageProvider(bp)
  const { MLToolkit: mlToolkit, logger } = bp

  return {
    partOfSpeechUtterances: (tokenUtterances: string[][], lang: string) => {
      const tagger = getPOSTagger(lang, mlToolkit)
      return tokenUtterances.map(tagSentence.bind(this, tagger))
    },
    tokenize_utterances: (utterances: string[], lang: string, vocab?: Token2Vec) =>
      languageProvider.tokenize(utterances, lang, vocab),
    vectorize_tokens: async (tokens, lang) => {
      const a = await languageProvider.vectorize(tokens, lang)
      return a.map(x => Array.from(x.values()))
    },
    generateSimilarJunkWords: (vocab: string[], lang: string) => languageProvider.generateSimilarJunkWords(vocab, lang),
    getHealth: healthGetter(languageProvider),
    getLanguages: () => languageProvider.languages,
    getVersionInfo: versionGetter(languageProvider),
    mlToolkit,
    duckling: new DucklingEntityExtractor(logger)
  }
}
