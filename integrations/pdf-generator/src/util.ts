import axios, { AxiosError } from 'axios'
import { marked } from 'marked'
import * as bp from '.botpress'

export function wrapHtml(content: string, tag: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Wrapped Content</title>
</head>
<body>
  <${tag}>${content}</${tag}>
</body>
</html>`
}

export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  return wrapHtml(await marked.parse(markdown), 'div')
}

export async function convertHtmlToPdf(html: string, filename: string) {
  const { data } = await axios.post(
    'https://api.pdfshift.io/v3/convert/pdf',
    {
      source: html,
      filename,
    },
    {
      headers: {
        Authorization: 'Basic ' + btoa('api:' + bp.secrets.PDFSHIFT_API_KEY),
      },
    }
  )

  const { data: buffer } = await axios.get(data.url, {
    responseType: 'arraybuffer', // Ensures the response is treated as a binary buffer
  })

  return buffer
}

export async function uploadPdf(client: any, buffer: Buffer, filename: string) {
  const { file } = await client.uploadFile({
    key: filename,
    accessPolicies: ['public_content'],
    content: buffer,
    contentType: 'application/pdf',
    index: false,
  })

  return {
    fileId: file.id,
    fileUrl: file.url!,
  }
}

export async function fromHtmlFunction(client: any, html: string, filename: string, logger: any) {
  try {
    logger.forBot().info('Converting HTML to PDF')

    const buffer = await convertHtmlToPdf(html, filename)
    const result = await uploadPdf(client, buffer, filename)

    return result
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.forBot().error(JSON.stringify(error.response?.data ?? {}, null, 2))
    } else {
      logger.forBot().error(error)
    }
    throw new Error('Failed to convert HTML to PDF: ' + error)
  }
}
