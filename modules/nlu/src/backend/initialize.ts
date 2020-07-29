import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import LangProvider from './language/language-provider'
import { NLUVersionInfo, LanguageProvider, Tools, Token2Vec } from './typings'
import { DucklingEntityExtractor } from './entities/duckling_extractor'
import { getPOSTagger, tagSentence } from './language/pos-tagger'

export const initializeLanguageProvider = async (bp: typeof sdk, version: NLUVersionInfo) => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  try {
    const languageProvider = await LangProvider.initialize(globalConfig.languageSources, bp.logger, version)

    const { validProvidersCount, validLanguages } = languageProvider.getHealth()
    const health = {
      isEnabled: validProvidersCount > 0 && validLanguages.length > 0,
      validProvidersCount,
      validLanguages
    }

    return { languageProvider, health }
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

export async function initDucklingExtractor(bp: typeof sdk): Promise<void> {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)
}

export function makeTools(
  mlToolkit: typeof sdk.MLToolkit,
  logger: sdk.Logger,
  languageProvider: LanguageProvider
): Tools {
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
    mlToolkit: mlToolkit,
    duckling: new DucklingEntityExtractor(logger)
  }
}
