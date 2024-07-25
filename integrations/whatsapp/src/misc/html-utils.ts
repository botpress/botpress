import SelectDialogPage from './pages/select-dialog'
import ButtonDialogPage from './pages/button-dialog'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import he from 'he'

export const generateHtml = ({
  header,
  body,
  options,
}: {
  header?: string
  body?: string
  options?: { title?: string }
}) => {
  return {
    headers: { 'content-type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options?.title || 'Botpress'}</title>
        <!-- Bootstrap CSS -->
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <style>
          html, body {
            height: 100%;
          }
        </style>
        ${header || ''}
      </head>
      <body>
        ${body || ''}
      </body>
      </html>
    `,
  }
}

export const redirectTo = async (url: string) => {
  return generateHtml({
    header: `
      <script>
        window.location = "${url}"
      </script>
    `,
    body: '<p>You are being redirected, please wait</p>',
    options: { title: 'Redirecting' },
  })
}

export const generateButtonDialog = (props: Parameters<typeof ButtonDialogPage>[0] & { title: string }) => {
  return generateHtml({
    body: renderReactComponentAsString(ButtonDialogPage(props)),
    options: { title: props.title },
  })
}

export const generateSelectDialog = (props: Parameters<typeof SelectDialogPage>[0]) => {
  return generateHtml({
    body: renderReactComponentAsString(SelectDialogPage(props)),
    options: { title: props.title },
  })
}

export const renderReactComponentAsString = (Component: JSX.Element) => {
  const jsxElement = React.createElement(React.Fragment, {}, [Component])
  const htmlBody = renderToStaticMarkup(jsxElement)
  return he.decode(htmlBody)
}

export const getInterstitialUrl = (success: boolean, message?: string) => {
  return (
    process.env.BP_WEBHOOK_URL?.replace('webhook', 'app') +
    `/oauth/interstitial?success=${success}${message ? `&errorMessage=${message}` : ''}`
  )
}
