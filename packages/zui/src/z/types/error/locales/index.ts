/**
 * Локализация сообщений об ошибках Zod/Zui
 *
 * Использование:
 *   import { z } from '@bpinternal/zui'
 *   import { getErrorMap, setLocale } from '@bpinternal/zui/locales'
 *
 *   // Установить русский язык
 *   setLocale('ru')
 *   z.setErrorMap(getErrorMap())
 *
 * Или использовать переменную окружения BOTPRESS_LOCALE=ru
 */

import { type ZodErrorMap } from '../../index'
import { errorMap as en } from './en'
import { errorMap as ru } from './ru'

export type SupportedLocale = 'en' | 'ru'

const locales: Record<SupportedLocale, ZodErrorMap> = {
  en,
  ru,
}

/**
 * Определяет текущую локаль на основе переменных окружения
 */
function detectLocale(): SupportedLocale {
  const bpLocale = process.env['BOTPRESS_LOCALE']?.toLowerCase()
  if (bpLocale && isValidLocale(bpLocale)) {
    return bpLocale
  }

  const systemLocale = process.env['LANG'] || process.env['LC_ALL'] || process.env['LC_MESSAGES'] || ''
  const langCode = systemLocale.split(/[_.-]/)[0]?.toLowerCase()

  if (langCode && isValidLocale(langCode)) {
    return langCode
  }

  return 'en'
}

function isValidLocale(locale: string): locale is SupportedLocale {
  return locale in locales
}

let currentLocale: SupportedLocale = detectLocale()

/**
 * Получить карту ошибок для текущей локали
 */
export function getErrorMap(): ZodErrorMap {
  return locales[currentLocale]
}

/**
 * Получить текущую локаль
 */
export function getLocale(): SupportedLocale {
  return currentLocale
}

/**
 * Установить локаль
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

// Экспорт отдельных карт ошибок
export { en, ru }
