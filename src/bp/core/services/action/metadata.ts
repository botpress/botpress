import { LocalActionDefinition } from 'common/typings'
import doctrine from 'doctrine'
import _ from 'lodash'
import yn from 'yn'

// Credit: https://stackoverflow.com/questions/35905181/regex-for-jsdoc-comments
const JSDocCommentRegex = /\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\//gi

export type ActionMetadata = Pick<
  LocalActionDefinition,
  'title' | 'category' | 'author' | 'description' | 'params' | 'hidden'
>

export const extractMetadata = (code: string): ActionMetadata => {
  const match = code.match(JSDocCommentRegex)
  const metadata: ActionMetadata = {
    title: '',
    category: '',
    description: '',
    author: '',
    hidden: false,
    params: []
  }

  if (!match) {
    return metadata
  }

  const extracted = doctrine.parse(match[0], {
    recoverable: true,
    sloppy: true,
    unwrap: true,
    strict: false,
    preserveWhitespace: false
  })

  metadata.description = extracted.description

  const author = _.find(extracted.tags, { title: 'author' })
  if (author) {
    metadata.author = (author as any).description || ''
  }

  const category = _.find(extracted.tags, { title: 'category' })
  if (category) {
    metadata.category = (category as any).description || ''
  }

  const title = _.find(extracted.tags, { title: 'title' })
  if (title) {
    metadata.title = (title as any).description || ''
  }

  const hidden = _.find(extracted.tags, { title: 'hidden' })
  if (hidden) {
    metadata.hidden = yn((hidden as any).description)
  }

  metadata.params = _.filter(extracted.tags, { title: 'param' }).map(tag => {
    const type: string = _.get(tag, 'type.name', '')
    const required = _.get(tag, 'type.type') !== doctrine.type.Syntax.OptionalType
    const def = _.get(tag, 'default', '')
    const name = _.get(tag, 'name', '')

    return {
      description: (tag as any).description || '',
      type,
      default: def,
      required,
      name
    }
  })

  return metadata
}
