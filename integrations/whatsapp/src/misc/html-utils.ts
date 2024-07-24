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

export const generateButtonDialog = ({
  title,
  description,
  buttons = [],
}: {
  title: string
  description: string
  buttons: {
    display: string
    type: 'primary' | 'secondary'
    action: 'NAVIGATE' | 'CLOSE_WINDOW'
    payload?: any
  }[]
}) => {
  return generateHtml({
    header: `
      <style>
          html, body {
            height: 100%;
          }
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
        .dialog-box {
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .dialog-box > div {
          column-gap: 5px;
          display: flex;
          justify-content: center;
        }
      </style>
    `,
    body: `
      <div class="container">
        <div class="dialog-box">
          <p>${description}</p>
          <div>
            ${buttons
              .map((button) => {
                switch (button.action) {
                  case 'NAVIGATE':
                    return `<a href="${button.payload}" class="btn btn-${button.type}">${button.display}</a>`
                  case 'CLOSE_WINDOW':
                    return `<a href="javascript:void(0);" onclick="window.close()" class="btn btn-${button.type}">${button.display}</a>`
                  default:
                    return ''
                }
              })
              .join('')}
          </div>
        </div>
      </div>
    `,
    options: { title },
  })
}

export const generateSelectDialog = ({
  title,
  description,
  select,
  settings,
  additionalData = [],
}: {
  title: string
  description: string
  select: {
    key: string
    options: { id: string; display: string }[]
  }
  settings: { targetUrl: string }
  additionalData?: { key: string; value: string }[]
}) => {
  return generateHtml({
    header: `
      <style>
        .container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
        }
        .form-container {
            width: 100%;
            max-width: 500px;
        }
      </style>
    `,
    body: `
        <div class="container">
            <div class="form-container">
                <h1 class="text-center">${title}</h1>
                <form action="${settings.targetUrl}" method="GET">
                    ${additionalData
                      .map(
                        (data) => `
                      <input type="hidden" name="${data.key}" value="${data.value}" />
                    `
                      )
                      .join('')}
                    <div class="form-group">
                        <label for="${select.key}">${description}:</label>
                        <div>
                            ${select.options
                              .map(
                                (option) => `
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" id="${option.id}" name="${select.key}" value="${option.id}">
                                    <label class="form-check-label" for="${option.id}">
                                        ${option.display}
                                    </label>
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Submit</button>
                </form>
            </div>
        </div>
    `,
    options: { title },
  })
}

export const getInterstitialUrl = (success: boolean, message?: string) => {
  return (
    process.env.BP_WEBHOOK_URL?.replace('webhook', 'app') +
    `/oauth/interstitial?success=${success}${message ? `&errorMessage=${message}` : ''}`
  )
}
