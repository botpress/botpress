import { RuntimeError } from '@botpress/client'
import { parsePhoneNumber, ParsedPhoneNumber } from 'awesome-phonenumber'

const ARGENTINA_COUNTRY_CODE = 54
const ARGENTINA_COUNTRY_CODE_AFTER_PREFIX = 9
const MEXICO_COUNTRY_CODE = 52
const MEXICO_COUNTRY_CODE_AFTER_PREFIX = 1

export function formatPhoneNumber(phoneNumber: string) {
  if (!phoneNumber.startsWith('+')) {
    // TODO log to use international phone number
    phoneNumber = `+${phoneNumber}`
  }
  const parsed = parsePhoneNumber(phoneNumber)
  if (parsed.possibility === 'invalid-country-code' || !parsed.number) {
    throw new RuntimeError('Invalid phone number, try adding the country code (e.g. +81 for Japan)')
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
    phone = _handleMexicoEdgeCases(parsed)
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
// Note: Mexico phone number should never have leading zeros to begin with since they follow the E.164 recommendation
const _handleMexicoEdgeCases = (parsedPhoneNumber: ParsedPhoneNumber): string => {
  if (!parsedPhoneNumber.number || !parsedPhoneNumber.countryCode) {
    throw new RuntimeError('Invalid phone number, try adding the country code (e.g. +52 55 1234 5678)')
  }
  let nationalNumber = _stripCountryCode(parsedPhoneNumber.number.e164, parsedPhoneNumber.countryCode)
  nationalNumber = _stripLeadingZeros(nationalNumber)
  if (parsedPhoneNumber.possibility === 'too-long') {
    nationalNumber = nationalNumber?.slice(1, nationalNumber.length)
  }
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
