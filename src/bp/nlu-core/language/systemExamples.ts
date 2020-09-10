import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'

export type SystemExamples = {
  [entity: string]: string[]
}

const SystemExamplesByLang: _.Dictionary<SystemExamples> = {}

async function loadSystemExamples(language: string): Promise<SystemExamples> {
  const filePath = path.resolve(process.APP_DATA_PATH, `./system-examples/${language}.json`)

  if (!(await fse.pathExists(filePath))) {
    return emptyExamples()
  }

  try {
    const fileContent = await fse.readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch {
    return emptyExamples()
  }
}

function emptyExamples() {
  const supportedSystems = ['time', 'number']
  return _.zipObject(
    supportedSystems,
    supportedSystems.map(_s => [])
  )
}

export async function getSystemExamplesForLang(language: string): Promise<SystemExamples> {
  if (!SystemExamplesByLang[language]) {
    SystemExamplesByLang[language] = await loadSystemExamples(language)
  }
  return SystemExamplesByLang[language]
}
