declare module 'botpress/i18n' {
  export function lang(id: string, values?: Record<string, string | PrimitiveType>): string
  export function langInit()
  export function langExtend(langs)
  export function langLocale(): string
}
