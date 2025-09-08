const _splitSpecialChars = (text: string) => text.split(/[^a-zA-Z0-9]/).filter((t) => !!t)
export const toSnakeCase = (text: string): string => _splitSpecialChars(text).join('_').toLowerCase()
export const toScreamingSnakeCase = (text: string): string => _splitSpecialChars(text).join('_').toUpperCase()
