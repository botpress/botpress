// E.164 phone number format: a "+" followed by 2-15 digits total, no leader zero
export const E164_REGEX = /^\+[1-9]\d{1,14}$/
// IETF BCP 47 tags: language-country, where Language is ISO 639-1/2 (2-3 letters, lowercase) and counter is ISO 3166 alpha-2 (2 letters, uppercase)
export const LOCALE_REGEX = /^[a-z]{2,3}-[A-Z]{2}$/
