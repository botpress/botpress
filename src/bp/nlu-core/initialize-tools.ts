import { NLU } from 'botpress/sdk'
import MLToolkit from 'ml/toolkit'

import { DucklingEntityExtractor } from './entities/duckling-extractor'
import LangProvider from './language/language-provider'
import { getPOSTagger, tagSentence } from './language/pos-tagger'
import SeededLodashProvider from './tools/seeded-lodash'
import { LanguageProvider, NLUVersionInfo, Token2Vec, Tools } from './typings'

const NLU_VERSION = '1.4.1'

const healthGetter = (languageProvider: LanguageProvider) => (): NLU.Health => {
  const { validProvidersCount, validLanguages } = languageProvider.getHealth()
  return {
    isEnabled: validProvidersCount! > 0 && validLanguages!.length > 0,
    validProvidersCount: validProvidersCount!,
    validLanguages: validLanguages!
  }
}

const versionGetter = (languageProvider: LanguageProvider) => (): NLUVersionInfo => {
  return {
    nluVersion: NLU_VERSION,
    langServerInfo: languageProvider.langServerInfo
  }
}

const initializeLanguageProvider = async (
  config: NLU.LanguageConfig,
  logger: NLU.Logger,
  seededLodashProvider: SeededLodashProvider
) => {
  try {
    const languageProvider = await LangProvider.initialize(
      config.languageSources,
      logger,
      NLU_VERSION,
      seededLodashProvider
    )
    const getHealth = healthGetter(languageProvider)
    return { languageProvider, health: getHealth() }
  } catch (e) {
    if (e.failure && e.failure.code === 'ECONNREFUSED') {
      logger.error(`Language server can't be reached at address ${e.failure.address}:${e.failure.port}`)
      if (!process.IS_FAILSAFE) {
        process.exit()
      }
    }
    throw e
  }
}

const initDucklingExtractor = async (config: NLU.LanguageConfig, logger: NLU.Logger): Promise<void> => {
  await DucklingEntityExtractor.configure(config.ducklingEnabled, config.ducklingURL, logger)
}

export async function initializeTools(config: NLU.LanguageConfig, logger: NLU.Logger): Promise<Tools> {
  await initDucklingExtractor(config, logger)

  const seededLodashProvider = new SeededLodashProvider()
  const { languageProvider } = await initializeLanguageProvider(config, logger, seededLodashProvider)

  return {
    partOfSpeechUtterances: (tokenUtterances: string[][], lang: string) => {
      const tagger = getPOSTagger(lang, MLToolkit)
      return tokenUtterances.map(u => tagSentence(tagger, u))
    },
    tokenize_utterances: (utterances: string[], lang: string, vocab?: string[]) =>
      languageProvider.tokenize(utterances, lang, vocab),
    vectorize_tokens: async (tokens, lang) => {
      const a = await languageProvider.vectorize(tokens, lang)
      return a.map(x => Array.from(x.values()))
    },
    generateSimilarJunkWords: (vocab: string[], lang: string) => languageProvider.generateSimilarJunkWords(vocab, lang),
    getHealth: healthGetter(languageProvider),
    getLanguages: () => languageProvider.languages,
    getVersionInfo: versionGetter(languageProvider),
    seededLodashProvider,
    mlToolkit: MLToolkit,
    duckling: new DucklingEntityExtractor(logger)
  }
}
