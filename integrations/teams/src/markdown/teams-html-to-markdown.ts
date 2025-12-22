import TurndownService from 'turndown'
import { defaultSanitizeConfig, sanitizeHtml } from './sanitize-utils'
import { customPlugin } from './turndown-rules/custom'
import { gfm } from './turndown-rules/gfm'

export function transformTeamsHtmlToStdMarkdown(teamsHtml: string) {
  const turndownService = new TurndownService({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    bulletListMarker: '-',
    hr: '\n\n---',
    preformattedCode: true,
  })

  gfm(turndownService)
  customPlugin(turndownService)

  const sanitizedHtml = sanitizeHtml(teamsHtml, {
    allowedSchemes: defaultSanitizeConfig.allowedSchemes.concat('tel'),
  })
  return (
    turndownService
      .turndown(sanitizedHtml)
      // Remove trailing spaces added before line breaks (Side effect of "<br />\n")
      .replace(/  \n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
  )
}
