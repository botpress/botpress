/**
 * @hidden true
 */

const key = args.randomId ? `skill-choice-invalid-count-${args.randomId}` : `skill-choice-invalid-count`
const value = (temp[key] || 0) + 1
temp[key] = value
