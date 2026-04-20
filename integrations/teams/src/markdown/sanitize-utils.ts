import SanitizeHTML from 'sanitize-html'

export const defaultSanitizeConfig = Object.assign({}, SanitizeHTML.defaults, {
  allowedTags: [
    'strong',
    'b',
    'em',
    'i',
    's',
    'del',
    'code',
    'pre',
    'blockquote',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'ol',
    'ul',
    'li',
    'hr',
    'br',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    pre: ['class'],
    code: ['class'],
    p: ['class'],
    span: ['style'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  exclusiveFilter(frame) {
    return frame.tag === 'a' && !frame.attribs.href?.trim() ? 'excludeTag' : false
  },
} satisfies SanitizeHTML.IOptions)

export const sanitizeHtml = (html: string, options?: Partial<SanitizeHTML.IOptions>) =>
  SanitizeHTML(html, options ? Object.assign({}, defaultSanitizeConfig, options) : defaultSanitizeConfig)

/** Avoid false positives with .__proto__, .hasOwnProperty, etc.
 *
 *  @remark Pulled from the "sanitize-html" package */
function has(obj: unknown, key: string) {
  return {}.hasOwnProperty.call(obj, key)
}

/** Checks if the provided URL is "naughty" (AKA potentially malicious).
 *
 *  @remark Pulled from the "sanitize-html" package to handle URL scanning
 *   for XSS with some minor adjustments (Mainly to make TypeScript happy)
 *  @remark The original function name in the package is "naughtyHref" */
export function isNaughtyUrl(tagName: string, href: string) {
  // Browsers ignore character codes of 32 (space) and below in a surprising
  // number of situations. Start reading here:
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet#Embedded_tab

  href = href.replace(/[\x00-\x20]+/g, '')
  // Clobber any comments in URLs, which the browser might
  // interpret inside an XML data island, allowing
  // a javascript: URL to be snuck through
  while (true) {
    const firstIndex = href.indexOf('<!--')
    if (firstIndex === -1) {
      break
    }
    const lastIndex = href.indexOf('-->', firstIndex + 4)
    if (lastIndex === -1) {
      break
    }
    href = href.substring(0, firstIndex) + href.substring(lastIndex + 3)
  }
  // Case insensitive so we don't get faked out by JAVASCRIPT #1
  // Allow more characters after the first so we don't get faked
  // out by certain schemes browsers accept
  const matches = href.match(/^([a-zA-Z][a-zA-Z0-9.\-+]*):/)
  const scheme = matches?.[1]?.toLowerCase()
  if (!scheme) {
    // Protocol-relative URL starting with any combination of '/' and '\'
    if (href.match(/^[/\\]{2}/)) {
      return !defaultSanitizeConfig.allowProtocolRelative
    }

    // No scheme
    return false
  }

  if (has(defaultSanitizeConfig.allowedSchemesByTag, tagName)) {
    return defaultSanitizeConfig.allowedSchemesByTag[tagName]?.indexOf(scheme) === -1
  }

  return !defaultSanitizeConfig.allowedSchemes || defaultSanitizeConfig.allowedSchemes.indexOf(scheme) === -1
}

export const escapeAndSanitizeHtml = (html: string) => {
  const escapedHtml = html
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

  // And sanitize it for good measure in
  // case above replacers missed something
  return sanitizeHtml(escapedHtml)
}
