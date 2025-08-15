import { z } from '@botpress/sdk'

/** A string that must contain at least 1 non-whitespace character. */
export const nonBlankString = z.string().trim().min(1)

export const calendlyUri = nonBlankString.url().brand('CalendlyUri')
export type CalendlyUri = z.infer<typeof calendlyUri>
