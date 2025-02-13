import { marked } from 'marked'
import { render } from 'preact-render-to-string'
import ButtonDialogPage from './pages/button-dialog'
import SelectDialogPage from './pages/select-dialog'

export const generateHtml = ({
  header,
  body,
  options,
  httpHeaders,
}: {
  header?: string
  body?: string
  options?: { title?: string }
  httpHeaders?: Record<string, string>
}) => {
  return {
    headers: {
      'content-type': 'text/html',
      ...httpHeaders,
    },
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
        window.location = "${encodeURI(url)}"
      </script>
    `,
    body: '<p>You are being redirected, please wait...</p>',
    options: { title: 'Redirecting' },
    httpHeaders: { 'x-bp-disable-interstitial': 'true' },
  })
}

export const generateButtonDialog = (props: Parameters<typeof ButtonDialogPage>[0] & { title: string }) => {
  props.description = marked.parse(props.description, { async: false }) as string

  return generateHtml({
    body: render(ButtonDialogPage(props)),
    options: { title: props.title },
    httpHeaders: { 'x-bp-disable-interstitial': 'true' },
  })
}

export const generateSelectDialog = (props: Parameters<typeof SelectDialogPage>[0]) => {
  return generateHtml({
    body: render(SelectDialogPage(props)),
    options: { title: props.title },
    httpHeaders: { 'x-bp-disable-interstitial': 'true' },
  })
}

export const getInterstitialUrl = (success: boolean, message?: string) => {
  return (
    process.env.BP_WEBHOOK_URL?.replace('webhook', 'app') +
    `/oauth/interstitial?success=${success}${message ? `&errorMessage=${message}` : ''}`
  )
}
