import { RuntimeError } from '@botpress/client'
import { parsePhoneNumber, ParsedPhoneNumber } from 'awesome-phonenumber'

const WA_ARGENTINA_COUNTRY_CODE = 54
const WA_ARGENTINA_COUNTRY_CODE_AFTER_PREFIX = 9
const WA_ARGENTINA_COUNTRY_CODE_TO_REMOVE = 15

const WA_MEXICO_COUNTRY_CODE = 52
const WA_MEXICO_COUNTRY_CODE_AFTER_PREFIX = 1

export function parseForWhatsApp(raw: string, defaultRegion: string = 'CA') {
  let parsed: ParsedPhoneNumber
  if (raw.startsWith('+')) {
    parsed = parsePhoneNumber(raw)
  } else {
    parsed = parsePhoneNumber(raw, { regionCode: defaultRegion })
  }
  if (!parsed?.valid) {
    throw new RuntimeError('Invalid phone number')
  }

  let phone = parsed.number.e164
  phone = _handleWhatsAppEdgeCases(phone, parsed)

  return phone
}

function _handleWhatsAppEdgeCases(phone: string, parsed: ParsedPhoneNumber): string {
  if (!parsed.countryCode) {
    return phone
  }

  if (parsed.countryCode === WA_ARGENTINA_COUNTRY_CODE) {
    phone = _handleArgentinaEdgeCases(phone, parsed.countryCode)
  } else if (parsed.countryCode === WA_MEXICO_COUNTRY_CODE) {
    phone = _handleMexicoEdgeCases(phone, parsed.countryCode)
  } else {
    let nationalNumber = _stripCountryCode(phone, parsed.countryCode)
    nationalNumber = _stripLeadingZeros(nationalNumber)
    phone = `+${parsed.countryCode}${nationalNumber}`
  }

  return phone
}

const _handleArgentinaEdgeCases = (phone: string, countryCode: number): string => {
  let nationalNumber = _stripCountryCode(phone, countryCode)

  if (nationalNumber.startsWith(WA_ARGENTINA_COUNTRY_CODE_TO_REMOVE.toString())) {
    nationalNumber = nationalNumber.substring(WA_ARGENTINA_COUNTRY_CODE_TO_REMOVE.toString().length)
  }

  nationalNumber = _stripLeadingZeros(nationalNumber)
  return `+${WA_ARGENTINA_COUNTRY_CODE}${WA_ARGENTINA_COUNTRY_CODE_AFTER_PREFIX}${nationalNumber}`
}

const _handleMexicoEdgeCases = (phone: string, countryCode: number): string => {
  let nationalNumber = _stripCountryCode(phone, countryCode)
  nationalNumber = _stripLeadingZeros(nationalNumber)
  return `+${WA_MEXICO_COUNTRY_CODE}${WA_MEXICO_COUNTRY_CODE_AFTER_PREFIX}${nationalNumber}`
}

const _stripLeadingZeros = (phone: string): string => {
  return phone.replace(/^0+/, '')
}

const _stripCountryCode = (phone: string, countryCode: number): string => {
  if (phone.startsWith('+')) {
    phone = phone.slice('+'.length)
  }
  return phone.slice(countryCode.toString().length)
}
