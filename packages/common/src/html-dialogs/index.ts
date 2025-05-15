import * as sdk from '@botpress/sdk'
import dedent from 'dedent'
import * as preact from 'preact-render-to-string'
import { DISABLE_INTERSTITIAL_HEADER } from '../oauth-wizard'
import { ButtonDialogPage, SelectDialogPage } from './components'

export const generateRedirection = (url: URL): sdk.Response => ({
  status: 303,
  headers: {
    ...DISABLE_INTERSTITIAL_HEADER,
    location: url.toString(),
  },
})

type CommonDialogProps = {
  pageTitle: string
}

export const generateButtonDialog = (props: Parameters<typeof ButtonDialogPage>[0] & CommonDialogProps): sdk.Response =>
  _generateHtml({
    bodyHtml: preact.render(ButtonDialogPage(props)),
    pageTitle: props.pageTitle,
  })

export const generateSelectDialog = (props: Parameters<typeof SelectDialogPage>[0] & CommonDialogProps): sdk.Response =>
  _generateHtml({
    bodyHtml: preact.render(SelectDialogPage(props)),
    pageTitle: props.pageTitle,
  })

export const generateRawHtmlDialog = (props: { bodyHtml: string; pageTitle?: string }): sdk.Response =>
  _generateHtml({
    bodyHtml: props.bodyHtml,
    pageTitle: props.pageTitle,
  })

const _generateHtml = ({ bodyHtml, pageTitle }: { bodyHtml: string; pageTitle?: string }): sdk.Response => {
  return {
    headers: {
      'content-type': 'text/html',
      ...DISABLE_INTERSTITIAL_HEADER,
    },
    body: dedent`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle || 'Botpress'}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
          integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65"
          rel="stylesheet" crossorigin="anonymous">
        <style>
          html, body {
            height: 100%;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `,
  }
}
