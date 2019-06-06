const StripSpecialChars = txt => txt.replace(/[&\/\\#,+()$!^~%.'":*?<>{}\u2581]/g, '').trim()

export const sanitize = (text: string): string => {
  // TODO Add ML-Based Sanitizer here

  return StripSpecialChars(text)
}
