import * as z from '../../index'

// Deliberately NOT wrapped in z.number() — a typo this fixture exists to detect.
// No @ts-expect-error here on purpose: this file's whole point is to be type-checked as-is.
export const Bad = z.object({
  name: z.string(),
  age: 42,
})
