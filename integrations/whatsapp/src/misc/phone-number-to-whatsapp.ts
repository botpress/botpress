import { RuntimeError } from '@botpress/client'
import { parsePhoneNumber, ParsedPhoneNumber } from 'awesome-phonenumber'

const ARGENTINA_COUNTRY_CODE = 54
const ARGENTINA_COUNTRY_CODE_AFTER_PREFIX = 9
const MEXICO_COUNTRY_CODE = 52
const MEXICO_COUNTRY_CODE_AFTER_PREFIX = 1

export function formatPhoneNumber(rawPhoneNumber: string, defaultRegion: string = 'CA') {
  let parsed: ParsedPhoneNumber
  if (rawPhoneNumber.startsWith('+')) {
    parsed = parsePhoneNumber(rawPhoneNumber)
  } else {
    parsed = parsePhoneNumber(rawPhoneNumber, { regionCode: defaultRegion })
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

  if (parsed.countryCode === ARGENTINA_COUNTRY_CODE) {
    phone = _handleArgentinaEdgeCases(phone, parsed.countryCode)
  } else if (parsed.countryCode === MEXICO_COUNTRY_CODE) {
    phone = _handleMexicoEdgeCases(phone, parsed.countryCode)
  } else {
    let nationalNumber = _stripCountryCode(phone, parsed.countryCode)
    nationalNumber = _stripLeadingZeros(nationalNumber)
    phone = `+${parsed.countryCode}${nationalNumber}`
  }

  return phone
}

// This needs to remove leading zeros and make sure the number starts with +549
const _handleArgentinaEdgeCases = (phone: string, countryCode: number): string => {
  let nationalNumber = _stripCountryCode(phone, countryCode)
  nationalNumber = _stripLeadingZeros(nationalNumber)

  if (nationalNumber.startsWith(ARGENTINA_COUNTRY_CODE_AFTER_PREFIX.toString())) {
    return `+${ARGENTINA_COUNTRY_CODE}${nationalNumber}`
  }

  return `+${ARGENTINA_COUNTRY_CODE}${ARGENTINA_COUNTRY_CODE_AFTER_PREFIX}${nationalNumber}`
}

// This needs to remove leading zeros and make sure the number starts with +521
const _handleMexicoEdgeCases = (phone: string, countryCode: number): string => {
  let nationalNumber = _stripCountryCode(phone, countryCode)
  nationalNumber = _stripLeadingZeros(nationalNumber)
  return `+${MEXICO_COUNTRY_CODE}${MEXICO_COUNTRY_CODE_AFTER_PREFIX}${nationalNumber}`
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
