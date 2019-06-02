export default '[' +
  '\\w-' +
  // Latin-1 Supplement (letters only) - https://en.wikipedia.org/wiki/List_of_Unicode_characters#Latin-1_Supplement
  '\u00C0-\u00D6' +
  '\u00D8-\u00F6' +
  '\u00F8-\u00FF' +
  // Latin Extended-A (without deprecated character) - https://en.wikipedia.org/wiki/List_of_Unicode_characters#Latin_Extended-A
  '\u0100-\u0148' +
  '\u014A-\u017F' +
  // Cyrillic symbols: \u0410-\u044F - https://en.wikipedia.org/wiki/Cyrillic_script_in_Unicode
  '\u0410-\u044F' +
  // hiragana (japanese): \u3040-\u309F - https://gist.github.com/ryanmcgrath/982242#file-japaneseregex-js
  '\u3040-\u309F' +
  // katakana (japanese): \u30A0-\u30FF - https://gist.github.com/ryanmcgrath/982242#file-japaneseregex-js
  '\u30A0-\u30FF' +
  // For an advanced explaination about Hangul see https://github.com/draft-js-plugins/draft-js-plugins/pull/480#issuecomment-254055437
  // Hangul Jamo (korean): \u3130-\u318F - https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
  // Hangul Syllables (korean): \uAC00-\uD7A3 - https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
  '\u3130-\u318F' +
  '\uAC00-\uD7A3' +
  // common chinese symbols: \u4e00-\u9eff - http://stackoverflow.com/a/1366113/837709
  '\u4e00-\u9eff' +
  ']*'
