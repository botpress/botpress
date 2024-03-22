/* eslint-disable no-console */
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib from 'path'
import puppeteer from 'puppeteer'
import * as consts from '../consts'

const readTsScript = () => {
  const filePath = pathlib.join(__dirname, 'script.ts')
  return fs.readFileSync(filePath, 'utf8')
}

const toJs = async (tsScript: string): Promise<string> => {
  const buildResult = await esbuild.build({
    stdin: {
      contents: tsScript,
      resolveDir: __dirname,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2017',
  })
  const jsScript = buildResult.outputFiles[0]!.text
  return jsScript
}

const launchBrowser = async (jsScript: string) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(false)

  try {
    await new Promise<typeof browser>((resolve, reject) => {
      page.on('console', (msg) => {
        const txt = msg.text()
        if (txt === consts.successMessage) {
          resolve(browser)
          return
        }
        if (txt === consts.failureMessage) {
          reject(new Error('Failure'))
          return
        }
        console.log(`>>> ${txt}`)
      })
      page.evaluate(jsScript).catch(reject)
      return browser
    })
  } finally {
    await browser.close()
  }
}

const main = async () => {
  const tsScript = readTsScript()
  const jsScript = await toJs(tsScript)
  await launchBrowser(jsScript)
}

void main()
  .then(() => {
    console.error('Browser Done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
