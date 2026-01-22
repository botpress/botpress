/**
 * Система локализации Botpress CLI
 * i18n system for Botpress CLI
 *
 * Использование / Usage:
 *   import { t } from './locales'
 *   console.log(t.commands.login.description) // "Войти в Botpress Cloud"
 *
 * Для смены языка / To change language:
 *   import { setLocale, getLocale } from './locales'
 *   setLocale('en') // switch to English
 */

import { ru } from './ru'

// Тип поддерживаемых локалей
export type SupportedLocale = 'ru' | 'en'

// Текущая локаль (по умолчанию русская)
let currentLocale: SupportedLocale = 'ru'

// Получение локали из переменной окружения
const envLocale = process.env.BP_LOCALE || process.env.LANG || ''
if (envLocale.toLowerCase().startsWith('en')) {
  // Если в системе английский язык, можно оставить оригинальные строки
  // Но по умолчанию мы всё равно используем русский
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
  currentLocale = locale
}

/**
 * Объект с переводами для текущей локали
 * Translation object for current locale
 */
export const t = ru

/**
 * Вспомогательная функция для интерполяции строк
 * Helper function for string interpolation
 *
 * Использование / Usage:
 *   interpolate("Привет, {name}!", { name: "Мир" }) // "Привет, Мир!"
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
}

export { ru }
