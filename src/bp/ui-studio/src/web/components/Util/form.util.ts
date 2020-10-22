export const isMissingCurlyBraceClosure = text => (text?.match(/{/g) || []).length !== (text?.match(/}/g) || []).length
