import MarkdownIt from 'markdown-it'
// @ts-ignore
import MarkdownItSub from 'markdown-it-sub'
// @ts-ignore
import MarkdownItSup from 'markdown-it-sup'

const md = MarkdownIt({
  html: false,
  xhtmlOut: false,
  breaks: false,
})
  .disable(['table', 'list', 'hr', 'link', 'blockquote'])
  .use(MarkdownItSub)
  .use(MarkdownItSup)

export const markdownToTwilio = (markdown: string): string => {
  return _removeHTMLTags(_extractImagesUrl(md.render(markdown))).trim()
}

const _removeHTMLTags = (input: string): string => {
  return input.replace(/<[^>]*>/g, '')
}

const _extractImagesUrl = (input: string): string => {
  return input.replace('<img src="', '').replace('" alt="image">', '')
}
