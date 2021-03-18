import { createReadStream } from 'fs'
import fse from 'fs-extra'
import path from 'path'
import readline from 'readline'

const StopWordsByLang: _.Dictionary<string[]> = {}

async function loadStopWords(language: string): Promise<string[]> {
  const filePath = path.resolve(process.APP_DATA_PATH, `./stop-words/${language}.txt`)

  if (!(await fse.pathExists(filePath))) {
    return []
  }

  return new Promise((resolve, reject) => {
    const stopWords: string[] = []
    const stream = createReadStream(filePath)
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
