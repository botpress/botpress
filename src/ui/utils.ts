import { zuiKey } from './constants'
import { resolveDiscriminator } from './hooks/useDiscriminator'
import { BaseType, JSONSchema, Path, ZuiComponentMap, ZuiReactComponent } from './types'

type ComponentMeta<Type extends BaseType = BaseType> = {
  type: Type
  Component: ZuiReactComponent<Type, 'default', any>
  id: string
  params: any
}

export const getSchemaType = (schema: JSONSchema): BaseType => {
  if (schema.anyOf?.length) {
    const discriminator = resolveDiscriminator(schema.anyOf)
    return discriminator ? 'discriminatedUnion' : 'object'
  }
  if (schema.type === 'integer') {
    return 'number'
  }

  return schema.type
}

export const resolveComponent = <Type extends BaseType>(
  components: ZuiComponentMap<any> | undefined,
  fieldSchema: JSONSchema,
): ComponentMeta<Type> | null => {
  const type = getSchemaType(fieldSchema)
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components?.[type]?.default

    if (!defaultComponent) {
      return null
    }

    return {
      Component: defaultComponent as ZuiReactComponent<Type, 'default', any>,
      type: type as Type,
      id: 'default',
      params: {},
    }
  }

  const componentID: string = uiDefinition[0]

  const Component = components?.[type]?.[componentID] || null

  if (!Component) {
    console.warn(`Component ${type}.${componentID} not found`)
    return null
  }

  const params = uiDefinition[1] || {}

  return {
    Component: Component as ZuiReactComponent<Type, 'default', any>,
    type: type as Type,
    id: componentID,
    params,
  }
}

export function pathMatches(path1: Path, path2: Path): boolean {
  if (path1.length !== path2.length) return false
  return path1.every((part, index) => part === path2[index])
}

export function formatTitle(title: string, separator?: RegExp): string {
  if (!separator) separator = new RegExp('/s|-|_| ', 'g')
  return decamelize(title).split(separator).map(capitalize).map(handleSpecialWords).reduce(combine)
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.substring(1)
}

function combine(acc: string, text: string): string {
  return `${acc} ${text}`
}

function decamelize(text: string): string {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
    .toLowerCase()
}

function handleSpecialWords(text: string, index: number, words: string[]): string {
  const lowercaseStr = text.toLowerCase()
  const uppercaseStr = text.toUpperCase()
  for (const special of specialCase) {
    if (special.toLowerCase() === lowercaseStr) return special
  }
  if (acronyms.includes(uppercaseStr)) return uppercaseStr
  // If the word is the first word in the sentence, but it's not a specially
  // cased word or an acronym, return the capitalized string
  if (index === 0) return text
  // If the word is the last word in the sentence, but it's not a specially
  // cased word or an acronym, return the capitalized string
  if (index === words.length - 1) return text
  // Return the word capitalized if it's 4 characters or more
  if (text.length >= 4) return text
  if (prepositions.includes(lowercaseStr)) return lowercaseStr
  if (conjunctions.includes(lowercaseStr)) return lowercaseStr
  if (articles.includes(lowercaseStr)) return lowercaseStr
  return text
}

const acronyms = [
  '2D',
  '3D',
  '4WD',
  'A2O',
  'API',
  'BIOS',
  'CCTV',
  'CC',
  'CCV',
  'CD',
  'CD-ROM',
  'COBOL',
  'CIA',
  'CMS',
  'CSS',
  'CSV',
  'CV',
  'DIY',
  'DVD',
  'DB',
  'DNA',
  'E3',
  'EIN',
  'ESPN',
  'FAQ',
  'FAQs',
  'FTP',
  'FPS',
  'FORTRAN',
  'FBI',
  'HTML',
  'HTTP',
  'ID',
  'IP',
  'ISO',
  'JS',
  'JSON',
  'LASER',
  'M2A',
  'M2M',
  'M2MM',
  'M2O',
  'MMORPG',
  'NAFTA',
  'NASA',
  'NDA',
  'O2M',
  'PDF',
  'PHP',
  'POP',
  'RAM',
  'RNGR',
  'ROM',
  'RPG',
  'RTFM',
  'RTS',
  'SCUBA',
  'SITCOM',
  'SKU',
  'SMTP',
  'SQL',
  'SSN',
  'SWAT',
  'TBS',
  'TTL',
  'TV',
  'TNA',
  'UI',
  'URL',
  'USB',
  'UWP',
  'VIP',
  'W3C',
  'WYSIWYG',
  'WWW',
  'WWE',
  'WWF',
]

const articles = ['a', 'an', 'the']

const conjunctions = [
  'and',
  'that',
  'but',
  'or',
  'as',
  'if',
  'when',
  'than',
  'because',
  'while',
  'where',
  'after',
  'so',
  'though',
  'since',
  'until',
  'whether',
  'before',
  'although',
  'nor',
  'like',
  'once',
  'unless',
  'now',
  'except',
]

const prepositions = [
  'about',
  'above',
  'across',
  'after',
  'against',
  'along',
  'among',
  'around',
  'at',
  'because of',
  'before',
  'behind',
  'below',
  'beneath',
  'beside',
  'besides',
  'between',
  'beyond',
  'but',
  'by',
  'concerning',
  'despite',
  'down',
  'during',
  'except',
  'excepting',
  'for',
  'from',
  'in',
  'in front of',
  'inside',
  'in spite of',
  'instead of',
  'into',
  'like',
  'near',
  'of',
  'off',
  'on',
  'onto',
  'out',
  'outside',
  'over',
  'past',
  'regarding',
  'since',
  'through',
  'throughout',
  'to',
  'toward',
  'under',
  'underneath',
  'until',
  'up',
  'upon',
  'up to',
  'with',
  'within',
  'without',
  'with regard to',
  'with respect to',
]

const specialCase = [
  '2FA',
  '3D',
  '4K',
  '5K',
  '8K',
  'AGI',
  'BI',
  'ChatGPT',
  'CTA',
  'DateTime',
  'GitHub',
  'GPT',
  'HD',
  'IBMid',
  'ID',
  'IDs',
  'iMac',
  'IMAX',
  'iOS',
  'IP',
  'iPad',
  'iPhone',
  'iPod',
  'LDAP',
  'LinkedIn',
  'LLM',
  'M2M',
  'M2O',
  'macOS',
  'McDonalds',
  'ML',
  'MySQL',
  'NLG',
  'NLP',
  'NLU',
  'O2M',
  'OpenAI',
  'PDFs',
  'PEFT',
  'pH',
  'PostgreSQL',
  'SEO',
  'TTS',
  'UHD',
  'UUID',
  'XSS',
  'YouTube',
]
