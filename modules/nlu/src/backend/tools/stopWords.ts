import { createReadStream } from 'fs'
import fs from 'fs-extra'
import path from 'path'
import readline from 'readline'

fs.exists

const StopWordsByLang: _.Dictionary<string[]> = {}

async function loadStopWords(language: string): Promise<string[]> {
  const fn = path.join(__dirname, `stopwords/${language}.txt`)

  const langSupported: boolean = await Promise.fromCallback(callback => {
    fs.exists(fn, callback.bind(this, undefined))
  })
  if (!langSupported) {
    return []
  }

  return new Promise((resolve, reject) => {
    const stopWords = []
    const stream = createReadStream(fn)
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

    rl.on('line', l => {
      stopWords.push(l)
    })

    rl.on('close', () => resolve(stopWords))
  })
}

export async function getStopWordsForLang(language: string): Promise<string[]> {
  if (!StopWordsByLang[language]) {
    StopWordsByLang[language] = await loadStopWords(language)
  }

  return StopWordsByLang[language]
}
