import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

import { convertAtlassianDocumentToMarkdown } from './confluenceToMarkdown'
import { convertMarkdownToHtml } from './markdownToHtml'

// Launch using npx ts-node run.ts

/*
/ Use local json for testing markdown parsing
*/
const fileName = 'jsonExample'
const PATH = __dirname + path.sep + 'testFiles'

const file = fs.readFileSync(path.join(PATH, fileName + '.json'), 'utf-8')
const markdown = convertAtlassianDocumentToMarkdown(JSON.parse(file))
const html = convertMarkdownToHtml(markdown)

const request = {
  spaceId: '131074',
  status: 'current',
  title: 'test post convertion',
  parentId: null,
  body: {
    representation: 'storage',
    value: html,
  },
}

const host = 'https://botpress.atlassian.net'
const auth = Buffer.from('').toString('base64')
const config = {
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
}
const response = axios.delete(`${host}/wiki/api/v2/pages/4980737`, config)

console.log('====================================')
console.log(html)
console.log('====================================')
// fs.writeFileSync(path.join(PATH, fileName + '.md'), markdown)

/*
/ Get directly from confluence API. Set getFromConfluence to true and provide credentials to use
*/
const getFromConfluence = false

const CONFLUENCE_HOST = 'workspace uri'
const CONFLUENCE_USER = 'mail'
const CONFLUENCE_API_TOKEN = 'token'

async function getConfluencePage(pageId: number, logger?: IntegrationLogger) {
  const auth = Buffer.from(`${CONFLUENCE_USER}:${CONFLUENCE_API_TOKEN}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  }
  try {
    const response = await axios.get(
      `${CONFLUENCE_HOST}/wiki/api/v2/pages/${pageId}?body-format=ATLAS_DOC_FORMAT`,
      config
    )
    return response.data
  } catch (err) {
    logger?.error('Error while calling confluence', err)
  }
}

if (getFromConfluence) {
  const file = getConfluencePage(213432) // provide relevant pageId

  void file.then((data) => {
    const markdown = convertAtlassianDocumentToMarkdown(JSON.parse(data.body.atlas_doc_format.value))
    // Write json and markdown results. JSON is used for debugging purposes (searching for tokens)
    fs.writeFileSync(path.join(PATH, fileName + '.json'), data.body.atlas_doc_format.value)
    fs.writeFileSync(path.join(PATH, fileName + '.md'), markdown)
  })
}
