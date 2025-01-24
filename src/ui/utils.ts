import { zuiKey } from './constants'
import { resolveDiscriminator } from './hooks/useDiscriminator'
import { ArraySchema, BaseType, JSONSchema, ObjectSchema, Path, ZuiComponentMap, ZuiReactComponent } from './types'

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

export const words = (string: string): string[] => {
  const hasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/
  const unicodeWords = /[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\d|\W)|[0-9]+/g
  const asciiWords = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g

  return hasUnicodeWord.test(string) ? string.match(unicodeWords) || [] : string.match(asciiWords) || []
}

const deburredLetters: { [key: string]: string } = {
  // Latin-1 Supplement block
  '\xc0': 'A',
  '\xc1': 'A',
  '\xc2': 'A',
  '\xc3': 'A',
  '\xc4': 'A',
  '\xc5': 'A',
  '\xe0': 'a',
  '\xe1': 'a',
  '\xe2': 'a',
  '\xe3': 'a',
  '\xe4': 'a',
  '\xe5': 'a',
  '\xc7': 'C',
  '\xe7': 'c',
  '\xd0': 'D',
  '\xf0': 'd',
  '\xc8': 'E',
  '\xc9': 'E',
  '\xca': 'E',
  '\xcb': 'E',
  '\xe8': 'e',
  '\xe9': 'e',
  '\xea': 'e',
  '\xeb': 'e',
  '\xcc': 'I',
  '\xcd': 'I',
  '\xce': 'I',
  '\xcf': 'I',
  '\xec': 'i',
  '\xed': 'i',
  '\xee': 'i',
  '\xef': 'i',
  '\xd1': 'N',
  '\xf1': 'n',
  '\xd2': 'O',
  '\xd3': 'O',
  '\xd4': 'O',
  '\xd5': 'O',
  '\xd6': 'O',
  '\xd8': 'O',
  '\xf2': 'o',
  '\xf3': 'o',
  '\xf4': 'o',
  '\xf5': 'o',
  '\xf6': 'o',
  '\xf8': 'o',
  '\xd9': 'U',
  '\xda': 'U',
  '\xdb': 'U',
  '\xdc': 'U',
  '\xf9': 'u',
  '\xfa': 'u',
  '\xfb': 'u',
  '\xfc': 'u',
  '\xdd': 'Y',
  '\xfd': 'y',
  '\xff': 'y',
  '\xc6': 'Ae',
  '\xe6': 'ae',
  '\xde': 'Th',
  '\xfe': 'th',
  '\xdf': 'ss',
  // Latin Extended-A block
  '\u0100': 'A',
  '\u0102': 'A',
  '\u0104': 'A',
  '\u0101': 'a',
  '\u0103': 'a',
  '\u0105': 'a',
  '\u0106': 'C',
  '\u0108': 'C',
  '\u010a': 'C',
  '\u010c': 'C',
  '\u0107': 'c',
  '\u0109': 'c',
  '\u010b': 'c',
  '\u010d': 'c',
  '\u010e': 'D',
  '\u0110': 'D',
  '\u010f': 'd',
  '\u0111': 'd',
  '\u0112': 'E',
  '\u0114': 'E',
  '\u0116': 'E',
  '\u0118': 'E',
  '\u011a': 'E',
  '\u0113': 'e',
  '\u0115': 'e',
  '\u0117': 'e',
  '\u0119': 'e',
  '\u011b': 'e',
  '\u011c': 'G',
  '\u011e': 'G',
  '\u0120': 'G',
  '\u0122': 'G',
  '\u011d': 'g',
  '\u011f': 'g',
  '\u0121': 'g',
  '\u0123': 'g',
  '\u0124': 'H',
  '\u0126': 'H',
  '\u0125': 'h',
  '\u0127': 'h',
  '\u0128': 'I',
  '\u012a': 'I',
  '\u012c': 'I',
  '\u012e': 'I',
  '\u0130': 'I',
  '\u0129': 'i',
  '\u012b': 'i',
  '\u012d': 'i',
  '\u012f': 'i',
  '\u0131': 'i',
  '\u0134': 'J',
  '\u0135': 'j',
  '\u0136': 'K',
  '\u0137': 'k',
  '\u0138': 'k',
  '\u0139': 'L',
  '\u013b': 'L',
  '\u013d': 'L',
  '\u013f': 'L',
  '\u0141': 'L',
  '\u013a': 'l',
  '\u013c': 'l',
  '\u013e': 'l',
  '\u0140': 'l',
  '\u0142': 'l',
  '\u0143': 'N',
  '\u0145': 'N',
  '\u0147': 'N',
  '\u014a': 'N',
  '\u0144': 'n',
  '\u0146': 'n',
  '\u0148': 'n',
  '\u014b': 'n',
  '\u014c': 'O',
  '\u014e': 'O',
  '\u0150': 'O',
  '\u014d': 'o',
  '\u014f': 'o',
  '\u0151': 'o',
  '\u0154': 'R',
  '\u0156': 'R',
  '\u0158': 'R',
  '\u0155': 'r',
  '\u0157': 'r',
  '\u0159': 'r',
  '\u015a': 'S',
  '\u015c': 'S',
  '\u015e': 'S',
  '\u0160': 'S',
  '\u015b': 's',
  '\u015d': 's',
  '\u015f': 's',
  '\u0161': 's',
  '\u0162': 'T',
  '\u0164': 'T',
  '\u0166': 'T',
  '\u0163': 't',
  '\u0165': 't',
  '\u0167': 't',
  '\u0168': 'U',
  '\u016a': 'U',
  '\u016c': 'U',
  '\u016e': 'U',
  '\u0170': 'U',
  '\u0172': 'U',
  '\u0169': 'u',
  '\u016b': 'u',
  '\u016d': 'u',
  '\u016f': 'u',
  '\u0171': 'u',
  '\u0173': 'u',
  '\u0174': 'W',
  '\u0175': 'w',
  '\u0176': 'Y',
  '\u0177': 'y',
  '\u0178': 'Y',
  '\u0179': 'Z',
  '\u017b': 'Z',
  '\u017d': 'Z',
  '\u017a': 'z',
  '\u017c': 'z',
  '\u017e': 'z',
  '\u0132': 'IJ',
  '\u0133': 'ij',
  '\u0152': 'Oe',
  '\u0153': 'oe',
  '\u0149': "'n",
  '\u017f': 's',
}

export const deburr = (string: string): string => {
  return string.replace(/[^\u0000-\u007E]/g, (char) => deburredLetters[char] || char)
}

export const camelCase = (string: string): string => {
  return words(deburr(string.replace(/['\u2019]/g, ''))).reduce((result: string, word: string, index: number) => {
    word = word.toLowerCase()
    return result + (index ? capitalize(word) : word)
  }, '')
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

export function isObjectSchema(schema: JSONSchema): schema is ObjectSchema {
  return schema.type === 'object' && typeof schema.properties === 'object' && schema.properties !== null
}

export function isArraySchema(schema: JSONSchema): schema is ArraySchema {
  return schema.type === 'array' && typeof schema.items === 'object' && schema.items !== null
}
