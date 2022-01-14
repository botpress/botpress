const _ = require('lodash')
const glob = require('glob')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

const defaultLangCode = 'en'
const locations = ['modules/**/translations/*.json', 'packages/**/translations/*.json']

const start = () => {
  const reorder = process.argv.find(x => x.toLowerCase() === '--reorder')
  if (reorder) {
    console.log(chalk.bold(`Reordering keys in translations...\r\n`))
    reorderTranslations()
  }

  console.log(
    chalk.bold(`
Checking consistency of translation files`)
  )
  console.log(`A missing key may either be in the default language (${defaultLangCode}) or in the displayed language.
  `)

  listMissingKeys()

  if (!reorder) {
    console.log(`\r\nType yarn cmd check-translations --reorder to reorder keys in all translation files`)
  }
}

const reorderTranslations = () => {
  for (const filePath of getTranslationElements().files) {
    const content = readFile(filePath)
    const sorted = sortObject(content)

    fs.writeFileSync(filePath, JSON.stringify(sorted, undefined, 2), 'UTF-8')
  }
}

const listMissingKeys = () => {
  for (const folder of getTranslationElements().folders) {
    const defaultLang = readFile(path.resolve(folder, defaultLangCode + '.json'))
    const languages = glob.sync(`${folder}/*.json`, { ignore: [`**/${defaultLangCode}.json`] })

    for (const lang of languages) {
      const currentLang = readFile(lang)
      const differences = _.difference(Object.keys(squash(defaultLang)), Object.keys(squash(currentLang)))

      if (differences.length) {
        console.log(chalk.bold(`\r\nKeys missing in ${folder} (${path.basename(lang)})`))
        differences.map(x => console.log(`- ${x}`))
      }
    }
  }
}

const getTranslationElements = () => {
  const folders = []
  const files = []

  for (const location of locations) {
    const fileList = glob.sync(location)
    files.push(...fileList)
    folders.push(..._.uniq(fileList.map(x => path.dirname(x))))
  }

  return { files, folders }
}

const sortObject = object => {
  const sortedObj = {}

  _.each(_.keys(object).sort(), key => {
    if (_.isObject(object[key]) && !_.isArray(object[key])) {
      sortedObj[key] = sortObject(object[key])
    } else {
      sortedObj[key] = object[key]
    }
  })

  return sortedObj
}

const squash = (space, root = {}, path = '') => {
  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, path + key + '.')
    } else {
      root[path + key] = value
    }
  }
  return root
}

const readFile = filePath => {
  try {
    return JSON.parse(fs.readFileSync(filePath))
  } catch (err) {
    console.error(`Couldn't parse file ${filePath}`)
  }
}

start()
