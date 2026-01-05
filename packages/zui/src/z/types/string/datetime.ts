// Adapted from https://stackoverflow.com/a/3143231

const DATETIME_REGEX_BASE = `\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}`
const DATETIME_REGEX_OFFSET = `(([+-]\\d{2}(:?\\d{2})?)|Z)`
const DATETIME_REGEX_OFFSET_NONE = `Z`
const DATETIME_REGEX_PRECISION_ARBITRARY = `(\\.\\d+)?`
const DATETIME_REGEX_PRECISION_SPECIFIC_BEGIN = `\\.\\d{`
const DATETIME_REGEX_PRECISION_SPECIFIC_END = `}`

type DateTimeArgs = { precision: number | null; offset: boolean }

export const generateDatetimeRegex = (args: DateTimeArgs) => {
  const precision = args.precision
    ? DATETIME_REGEX_PRECISION_SPECIFIC_BEGIN + args.precision + DATETIME_REGEX_PRECISION_SPECIFIC_END
    : args.precision === 0
      ? ''
      : DATETIME_REGEX_PRECISION_ARBITRARY

  const offset = args.offset ? DATETIME_REGEX_OFFSET : DATETIME_REGEX_OFFSET_NONE

  return new RegExp(`^${DATETIME_REGEX_BASE}${precision}${offset}$`)
}

export const extractPrecisionAndOffset = (regexSource: string): DateTimeArgs => ({
  precision: _extractPrecision(regexSource),
  offset: regexSource.endsWith(`${DATETIME_REGEX_OFFSET}$`),
})

const _extractPrecision = (regexSource: string): DateTimeArgs['precision'] => {
  const slicedRegex = regexSource.slice(1 + DATETIME_REGEX_BASE.length)

  if (slicedRegex.startsWith(DATETIME_REGEX_PRECISION_ARBITRARY)) {
    return null
  } else if (slicedRegex.startsWith(DATETIME_REGEX_PRECISION_SPECIFIC_BEGIN)) {
    // NOTE: If parseInt encounters a character that is not a numeral in the
    //       specified radix, it ignores it and all succeeding characters. This
    //       means we do not need to know the length of the precision string.
    return parseInt(slicedRegex.slice(DATETIME_REGEX_PRECISION_SPECIFIC_BEGIN.length))
  }

  return 0
}
