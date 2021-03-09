import * as sdk from 'botpress/sdk'
// DICTIONARIES SOURCES (only wooorm was used here and I removed most of them):
// https://cgit.freedesktop.org/libreoffice/dictionaries/tree/
// http://wordlist.aspell.net/dicts/
// https://extensions.openoffice.org/en/search?f%5B0%5D=field_project_tags%3A157
// https://addons.mozilla.org/en-US/firefox/language-tools/
// https://github.com/wooorm/dictionaries
import api from './api'
import { SpellChecker } from './spellchecker'
import { LANGUAGES, Languages } from './typings'
const spellcheckers = {}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, spellcheckers)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const languages = (await bp.bots.getBotById(botId)).languages

  languages.forEach(lang => {
    if (LANGUAGES.includes(lang) && !spellcheckers[lang]) {
      spellcheckers[lang] = new SpellChecker(lang as Languages)
    }
  })
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('spellchecker')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onBotMount,
  onModuleUnmount,
  definition: {
    name: 'spellchecker',
    menuIcon: 'chat',
    menuText: 'SpellChecker',
    fullName: 'SpellChecker',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
