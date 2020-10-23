export const isMissingCurlyBraceClosure = (text: string): boolean =>
  (text?.match(/{{/g) || []).length !== (text?.match(/}}/g) || []).length
