const Open = 'async function* __fn__() {'
const Close = '}'

// Unique markers to identify user code boundaries in transformed output
export const USER_CODE_START_MARKER = '/* __LLMZ_USER_CODE_START__ */'
export const USER_CODE_END_MARKER = '/* __LLMZ_USER_CODE_END__ */'

export const AsyncIterator = {
  preProcessing: (code: string) => {
    return `"use strict";
${Open}
${USER_CODE_START_MARKER}
${code}
${USER_CODE_END_MARKER}
${Close}
`.trim()
  },
  postProcessing: (code: string) => {
    code = code.slice(code.indexOf(Open) + Open.length).trim()
    code = code.slice(0, code.lastIndexOf(Close))
    // Remove markers from final output
    code = code.replace(USER_CODE_START_MARKER, '').replace(USER_CODE_END_MARKER, '')
    return code
  },
}
