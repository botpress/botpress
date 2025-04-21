/**
 * Escapes special characters in a string for use in a regular expression.
 * This effectively makes the string completely inert and unable to cause regex
 * injections.
 */
export const escapeSpecialChars = (unsafeString: string) => unsafeString.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
