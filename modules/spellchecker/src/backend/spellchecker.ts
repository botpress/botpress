import axios from 'axios'
import fs from 'fs'

import { Nodehun } from 'nodehun'
import { Languages } from './typings'
export class SpellChecker {
  private model: Nodehun

  constructor(public lang: Languages) {
    const affix = fs.readFileSync(`../../dictionaries/${lang}/index.aff`)
    const dict = fs.readFileSync(`../../dictionaries/${lang}/index.aff`)
    this.model = new Nodehun(affix, dict)
  }

  suggestWord(word: string) {
    const suggestions = this.model.suggestSync(word)
    return suggestions
  }

  correctWord(word: string) {
    const suggestions = this.model.suggestSync(word)
    return suggestions[0]
  }

  isWordCorrect(word: string): boolean {
    return this.model.spellSync(word)
  }

  async isCorrect(sentence: string): Promise<boolean> {
    const words = await this._tokenize(sentence)
    return words.every(w => this.isWordCorrect(w))
  }

  async correct(sentence: string): Promise<string> {
    const words = await this._tokenize(sentence)
    return words.map(w => (this.correctWord(w) ? this.correctWord(w) : w)).join(' ')
  }

  async suggest(sentence: string): Promise<string[][]> {
    const words = await this._tokenize(sentence)
    return words.map(w => this.suggestWord(w))
  }

  private async _tokenize(sentence: string): Promise<string[]> {
    const { data } = await axios.post('https://lang-01.botpress.io/tokenize', {
      utterances: [sentence],
      lang: this.lang
    })

    const tokens: string[] = data.tokens.map(tok => tok.replace('▁', ''))
    return tokens
  }
}
