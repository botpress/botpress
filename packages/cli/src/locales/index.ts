/**
 * Система локализации Botpress CLI
 *
 * Для переключения языка установите переменную окружения BOTPRESS_LOCALE:
 *   export BOTPRESS_LOCALE=ru  # для русского языка
 *   export BOTPRESS_LOCALE=en  # для английского языка (по умолчанию)
 *
 * Или используйте системную локаль (LANG, LC_ALL)
 */

import { en } from './en'
import { ru } from './ru'
import type { LocaleStrings } from './types'

export type { LocaleStrings } from './types'

export type SupportedLocale = 'en' | 'ru'

const locales: Record<SupportedLocale, LocaleStrings> = {
  en,
  ru,
}

/**
 * Определяет текущую локаль на основе переменных окружения
 */
function detectLocale(): SupportedLocale {
  // 1. Проверяем явно установленную переменную BOTPRESS_LOCALE
  const bpLocale = process.env['BOTPRESS_LOCALE']?.toLowerCase()
  if (bpLocale && isValidLocale(bpLocale)) {
    return bpLocale
  }

  // 2. Проверяем системные переменные локали
  const systemLocale = process.env['LANG'] || process.env['LC_ALL'] || process.env['LC_MESSAGES'] || ''
  const langCode = systemLocale.split(/[_.-]/)[0]?.toLowerCase()

  if (langCode && isValidLocale(langCode)) {
    return langCode
  }

  // 3. По умолчанию — английский
  return 'en'
}

function isValidLocale(locale: string): locale is SupportedLocale {
  return locale in locales
}

// Текущая локаль
let currentLocale: SupportedLocale = detectLocale()

/**
 * Получить текущие строки локализации
 */
export function getStrings(): LocaleStrings {
  return locales[currentLocale]
}

/**
 * Получить текущую локаль
 */
export function getLocale(): SupportedLocale {
  return currentLocale
}

/**
 * Установить локаль программно
 */
export function setLocale(locale: SupportedLocale): void {
  if (!isValidLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}. Supported: ${Object.keys(locales).join(', ')}`)
  }
  currentLocale = locale
}

/**
 * Получить список поддерживаемых локалей
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(locales) as SupportedLocale[]
}

/**
 * Утилита для подстановки параметров в строку
 * Пример: interpolate('Hello {name}!', { name: 'World' }) => 'Hello World!'
 */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : `{${key}}`
  })
}

// Экспорт для удобства
export const t = getStrings

// Экспорт локалей напрямую для тестирования
export { en, ru }
