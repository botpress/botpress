import { NLU } from 'botpress/sdk'
import MLToolkit from 'ml/toolkit'
import path from 'path'
import yn from 'yn'
import { DucklingEntityExtractor } from './entities/duckling-extractor'
import { SystemEntityCacheManager } from './entities/entity-cache-manager'
import { MicrosoftEntityExtractor } from './entities/microsoft-extractor'
import LangProvider from './language/language-provider'
import { getPOSTagger, tagSentence } from './language/pos-tagger'
import { getStopWordsForLang } from './language/stopWords'
import SeededLodashProvider from './tools/seeded-lodash'
import { LanguageProvider, SystemEntityExtractor, Tools } from './typings'

const NLU_VERSION = '2.1.0'

const healthGetter = (languageProvider: LanguageProvider) => (): NLU.Health => {
  const { validProvidersCount, validLanguages } = languageProvider.getHealth()
  return {
    isEnabled: validProvidersCount! > 0 && validLanguages!.length > 0,
    validProvidersCount: validProvidersCount!,
    validLanguages: validLanguages!
  }
}

const versionGetter = (languageProvider: LanguageProvider) => (): NLU.Specifications => {
  const { langServerInfo } = languageProvider
  const { dim, domain, version } = langServerInfo

  return {
    nluVersion: NLU_VERSION,
    languageServer: {
      dimensions: dim,
      domain,
      version
    }
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

const makeSystemEntityExtractor = async (
  config: NLU.LanguageConfig,
  logger: NLU.Logger
): Promise<SystemEntityExtractor> => {
  let extractor: SystemEntityExtractor

  if (yn(process.env.BP_MICROSOFT_RECOGNIZER)) {
    const msCache = new SystemEntityCacheManager(
      path.join(process.APP_DATA_PATH, 'cache', 'microsoft_sys_entities.json'),
      true,
      logger
    )
    extractor = new MicrosoftEntityExtractor(msCache, logger)
    await extractor.configure()
  } else {
    const duckCache = new SystemEntityCacheManager(
      path.join(process.APP_DATA_PATH, 'cache', 'duckling_sys_entities.json'),
      true,
      logger
    )
    extractor = new DucklingEntityExtractor(duckCache, logger)
    await extractor.configure(config.ducklingEnabled, config.ducklingURL)
  }

  return extractor
}

export async function initializeTools(config: NLU.LanguageConfig, logger: NLU.Logger): Promise<Tools> {
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
    getStopWordsForLang,

    getHealth: healthGetter(languageProvider),
    getLanguages: () => languageProvider.languages,
    getSpecifications: versionGetter(languageProvider),
    seededLodashProvider,
    mlToolkit: MLToolkit,
    systemEntityExtractor: await makeSystemEntityExtractor(config, logger)
  }
}
