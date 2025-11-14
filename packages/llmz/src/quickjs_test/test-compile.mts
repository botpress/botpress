#!/usr/bin/env tsx
import { compile } from '../compiler/index.js'

const code = `
const x = 1 + 2
const y = x * 3
return { action: 'done', value: y }
`

const result = compile(code)
console.log('=== COMPILED CODE ===')
console.log(result.code)
