export function ressourceMatches(pattern, res) {
  const separator = /[\/\.]/
  pattern = pattern || ''

  if (!~pattern.indexOf('*')) {
    pattern = pattern += '.*'
  }

  const parts = pattern.split(separator)
  const testParts = res.split(separator)

  let matches = true
  for (let ii = 0; matches && ii < parts.length; ii++) {
    if (parts[ii] === '*') {
      continue
    } else if (ii < testParts.length) {
      matches = parts[ii].toLowerCase() === testParts[ii].toLowerCase()
    } else {
      matches = false
    }
  }

  return matches
}

export function checkRule(rules, operation, ressource) {
  operation = /^r|read$/i.test(operation) ? 'r' : operation
  operation = /^w|write$/i.test(operation) ? 'w' : operation

  if (operation !== 'r' && operation !== 'w') {
    throw new Error('Invalid rule operation: ' + operation)
  }

  let permission = false // Everything is restricted by default

  for (const rule of rules) {
    if (ressourceMatches(rule.res, ressource)) {
      if (rule.op.length === 4) {
        if (rule.op[1] === operation) {
          permission = rule.op[0] === '+'
        } else if (rule.op[3] === operation) {
          permission = rule.op[2] === '+'
        } else {
          permission = false
        }
      }
      if (rule.op.length === 3) {
        permission = rule.op[0] === '+'
      } else if (rule.op[1] === operation) {
        permission = rule.op[0] === '+'
      } else {
        // leave the permission untouched
      }
    }
  }

  return permission
}
