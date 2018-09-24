import doctrine from 'doctrine'
import _ from 'lodash'

// Credit: https://stackoverflow.com/questions/35905181/regex-for-jsdoc-comments
const JSDocCommentRegex = /\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\//gi

export type ActionMetadata = {
  description: string
  author: string
  params: {
    type: string
    isOptional: boolean
    default: any
    description: string
  }[]
}

export const extractMetadata = (code: string) => {
  const match = code.match(JSDocCommentRegex)
  const metadata: ActionMetadata = {
    description: '',
    author: '',
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

  metadata.params = _.filter(extracted.tags, { title: 'param' }).map(tag => {
    const type: string = _.get(tag, 'type.name', '')
    const isOptional = _.get(tag, 'type.type') === doctrine.type.Syntax.OptionalType
    const def = _.get(tag, 'type.default', '')

    return {
      description: (tag as any).description || '',
      type,
      default: def,
      isOptional
    }
  })

  return metadata
}
