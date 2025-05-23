const Open = 'async function* __fn__() {'
const Close = '}'

export const AsyncIterator = {
  preProcessing: (code: string) => {
    return `"use strict";
${Open}
${code}
${Close}
`.trim()
  },
  postProcessing: (code: string) => {
    code = code.slice(code.indexOf(Open) + Open.length).trim()
    code = code.slice(0, code.lastIndexOf(Close))
    return code
  },
}
