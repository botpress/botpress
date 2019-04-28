const StripSpecialChars = txt => txt.replace(/[&\/\\#,+()$!^~%.'":*?<>{}]/g, '')

export const sanitize = (text: string): string => {
  // TODO Add ML-Based Sanitizer here
  return StripSpecialChars(text)
}
