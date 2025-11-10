import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'

import { getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'

type File = {
  path: string
  name: string
  content: string
}

const simpleFile: File = {
  path: 'src/hello.ts',
  name: 'hello.ts',
  content: `function greet(name: string) {
  console.log('Hello, ' + name)
}

greet('World')`,
}

const configFile: File = {
  path: 'config.json',
  name: 'config.json',
  content: `{
  "version": "1.0.0",
  "name": "test-app",
  "enabled": true
}`,
}

const packageFile: File = {
  path: 'package.json',
  name: 'package.json',
  content: `{
  "name": "my-app",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}`,
}

describe('zai.patch', { timeout: 60_000 }, () => {
  const zai = getZai()

  it('patches a single file with simple instruction and verifies syntax', async () => {
    const result = await zai.patch([simpleFile], 'change the greeting message to say "Hi" instead of "Hello"').result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].path).toBe('src/hello.ts')
    expect(result.output[0].name).toBe('hello.ts')
    expect(result.output[0].content).toContain('Hi')
    expect(result.output[0].content).not.toContain('Hello')
    expect(result.output[0].content).toContain('greet')

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "function greet(name: string) {
        console.log('Hi, ' + name)
      }

      greet('World')"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎=2|  console.log('Hi, ' + name)"`)
  })

  it('patches a single file by adding a line', async () => {
    const result = await zai
      .patch(
        [simpleFile],
        'add a complete JSDoc comment block (/** ... */) above the greet function that describes what it does'
      )
      .result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('/**')
    expect(result.output[0].content).toContain('*/')
    expect(result.output[0].content).toContain('function greet')

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "/**
       * Greets the provided name.
       */
      function greet(name: string) {
        console.log('Hello, ' + name)
      }

      greet('World')"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`
      "◼︎=1|/**
       * Greets the provided name.
       */
      function greet(name: string) {"
    `)
  })

  it('patches a single file by deleting a line', async () => {
    const result = await zai.patch([simpleFile], 'remove the greet function call at the bottom').result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('function greet')
    expect(result.output[0].content).not.toContain("greet('World')")

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "function greet(name: string) {
        console.log('Hello, ' + name)
      }
      "
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎-005"`)
  })

  it('patches multiple files with a single instruction', async () => {
    const files = [configFile, packageFile]
    const result = await zai.patch(files, 'change version to 2.0.0 in all files').result()

    expect(result.output).toHaveLength(2)
    expect(result.output.find((f) => f.name === 'config.json')?.content).toContain('"version": "2.0.0"')
    expect(result.output.find((f) => f.name === 'package.json')?.content).toContain('"version": "2.0.0"')

    expect(result.output.find((f) => f.name === 'config.json')?.patch).toMatchInlineSnapshot(
      `"◼︎=2|  "version": "2.0.0","`
    )
    expect(result.output.find((f) => f.name === 'package.json')?.patch).toMatchInlineSnapshot(
      `"◼︎=3|  "version": "2.0.0","`
    )
  })

  it('patches JSON file correctly', async () => {
    const result = await zai
      .patch([configFile], 'add a new field "description": "A test application" after the name field')
      .result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('"description": "A test application"')
    expect(result.output[0].content).toContain('"name": "test-app"')
    // Verify it's still valid JSON structure
    expect(() => JSON.parse(result.output[0].content)).not.toThrow()

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "{
        "version": "1.0.0",
        "name": "test-app",
        "description": "A test application",
        "enabled": true
      }"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎>003|  "description": "A test application","`)
  })

  it('handles complex multi-line changes', async () => {
    const result = await zai
      .patch(
        [simpleFile],
        'refactor the greet function to accept an optional greeting parameter that defaults to "Hello"'
      )
      .result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('greet')
    // Should have parameter with default or optional parameter
    const hasDefaultParam =
      result.output[0].content.includes('greeting = ') ||
      result.output[0].content.includes('greeting?') ||
      result.output[0].content.includes('greeting: string = ')
    expect(hasDefaultParam).toBe(true)

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "function greet(name: string, greeting: string = "Hello") {
        console.log(greeting + ', ' + name)
      }

      greet('World')"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`
      "◼︎=001|function greet(name: string, greeting: string = "Hello") {
      ◼︎=002|  console.log(greeting + ', ' + name)"
    `)
  })

  it('leaves files unchanged when instruction says no changes needed', async () => {
    const result = await zai.patch([simpleFile], 'only modify files that use React hooks').result()

    expect(result.output).toHaveLength(1)
    // File should be mostly unchanged since it doesn't use React
    expect(result.output[0].path).toBe(simpleFile.path)

    expect(result.output[0].patch).toMatchInlineSnapshot(`""`)
  })

  it('handles empty files array', async () => {
    const result = await zai.patch([], 'change something').result()

    expect(result.output).toHaveLength(0)
  })

  it('preserves file metadata (path and name)', async () => {
    const files = [
      { path: 'src/components/Button.tsx', name: 'Button.tsx', content: 'export const Button = () => null' },
      { path: 'src/utils/helper.ts', name: 'helper.ts', content: 'export const helper = () => {}' },
    ]

    const result = await zai.patch(files, 'add a comment at the top of each file').result()

    expect(result.output).toHaveLength(2)
    expect(result.output.find((f) => f.path === 'src/components/Button.tsx')).toBeDefined()
    expect(result.output.find((f) => f.path === 'src/utils/helper.ts')).toBeDefined()
    expect(result.output.find((f) => f.name === 'Button.tsx')).toBeDefined()
    expect(result.output.find((f) => f.name === 'helper.ts')).toBeDefined()

    expect(result.output.find((f) => f.name === 'Button.tsx')?.patch).toMatchInlineSnapshot(`"◼︎<001|//"`)
    expect(result.output.find((f) => f.name === 'helper.ts')?.patch).toMatchInlineSnapshot(`"◼︎<001|//"`)
  })

  it('handles file with special characters in content', async () => {
    const specialFile: File = {
      path: 'test.md',
      name: 'test.md',
      content: `# Title\n\nContent with \`code\` and **bold** and [links](url)`,
    }

    const result = await zai.patch([specialFile], 'add a new section called "## Installation"').result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('## Installation')
    expect(result.output[0].content).toContain('# Title')

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "# Title

      Content with \`code\` and **bold** and [links](url)
      ## Installation"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎>3|## Installation"`)
  })

  it('can add multiple sections to different files', async () => {
    const file1: File = { path: 'file1.txt', name: 'file1.txt', content: 'Line 1\nLine 2' }
    const file2: File = { path: 'file2.txt', name: 'file2.txt', content: 'Content A\nContent B' }

    const result = await zai.patch([file1, file2], 'add "# Header" at the beginning of each file').result()

    expect(result.output).toHaveLength(2)
    expect(result.output[0].content).toContain('# Header')
    expect(result.output[1].content).toContain('# Header')

    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎<1|# Header"`)
    expect(result.output[1].patch).toMatchInlineSnapshot(`"◼︎<1|# Header"`)
  })

  it('replaces a range of lines', async () => {
    const multiLineFile: File = {
      path: 'example.ts',
      name: 'example.ts',
      content: `const a = 1
const b = 2
const c = 3
const d = 4
const e = 5`,
    }

    const result = await zai
      .patch(
        [multiLineFile],
        'replace lines 2 to 4 (const b through const d) with a single line: const sum = 2 + 3 + 4'
      )
      .result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('const sum')
    expect(result.output[0].content).toContain('const a = 1')
    expect(result.output[0].content).toContain('const e = 5')
    expect(result.output[0].content).not.toContain('const b = 2')
    expect(result.output[0].content).not.toContain('const c = 3')
    expect(result.output[0].content).not.toContain('const d = 4')

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "const a = 1
      const sum = 2 + 3 + 4
      const e = 5"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎=2-4|const sum = 2 + 3 + 4"`)
  })

  it('ensures patched JSON is valid JSON', async () => {
    const jsonFile: File = {
      path: 'data.json',
      name: 'data.json',
      content: `{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ],
  "count": 2
}`,
    }

    const result = await zai
      .patch([jsonFile], 'add a new user {"id": 3, "name": "Charlie"} to the users array and update count to 3')
      .result()

    expect(result.output).toHaveLength(1)
    // Verify it's valid JSON
    expect(() => JSON.parse(result.output[0].content)).not.toThrow()
    const parsed = JSON.parse(result.output[0].content)
    expect(parsed.users).toHaveLength(3)
    expect(parsed.count).toBe(3)
    expect(parsed.users[2].name).toBe('Charlie')

    expect(result.output[0].content).toMatchInlineSnapshot(`
      "{
        "users": [
          {"id": 1, "name": "Alice"},
          {"id": 2, "name": "Bob"},
          {"id": 3, "name": "Charlie"}
        ],
        "count": 3
      }"
    `)
    expect(result.output[0].patch).toMatchInlineSnapshot(`
      "◼︎=4|    {"id": 2, "name": "Bob"},
      ◼︎<5|    {"id": 3, "name": "Charlie"}
      ◼︎=6|  "count": 3"
    `)
  })

  it('handles large file with chunking', async () => {
    // Create a large file with many lines (but not TOO large)
    const largeContent = Array.from({ length: 1000 }, (_, i) => `const var${i} = ${i}`).join('\n')
    const largeFile: File = {
      path: 'large.ts',
      name: 'large.ts',
      content: largeContent,
    }

    const result = await zai.patch([largeFile], 'add a comment "// Variables" at the very top').result()

    expect(result.output).toHaveLength(1)
    expect(result.output[0].content).toContain('// Variables')
    expect(result.output[0].content).toContain('const var0 = 0')

    expect(result.output[0].patch).toMatchInlineSnapshot(`"◼︎<1|// Variables"`)
  })

  it('patches code that requires understanding context from two files', async () => {
    const apiFile: File = {
      path: 'src/api.ts',
      name: 'api.ts',
      content: `export interface User {
  id: number
  name: string
}

export function getUser(id: number): User {
  return { id, name: 'Unknown' }
}`,
    }

    const componentFile: File = {
      path: 'src/UserComponent.tsx',
      name: 'UserComponent.tsx',
      content: `import { getUser } from './api'

export function UserComponent({ userId }: { userId: number }) {
  const user = getUser(userId)
  return <div>{user.name}</div>
}`,
    }

    const result = await zai
      .patch(
        [apiFile, componentFile],
        'add an email field to the User interface and update the component to display it'
      )
      .result()

    expect(result.output).toHaveLength(2)
    const patchedApi = result.output.find((f) => f.name === 'api.ts')
    const patchedComponent = result.output.find((f) => f.name === 'UserComponent.tsx')

    // API should have email field
    expect(patchedApi?.content).toContain('email')
    // Component should display email
    expect(patchedComponent?.content).toContain('email')

    expect(patchedApi?.content).toMatchInlineSnapshot(`
      "export interface User {
        id: number
        name: string
        email: string
      }

      export function getUser(id: number): User {
        return { id, name: 'Unknown', email: 'unknown@example.com' }
      }"
    `)
    expect(patchedApi?.patch).toMatchInlineSnapshot(`
      "◼︎>003|  email: string
      ◼︎=007|  return { id, name: 'Unknown', email: 'unknown@example.com' }"
    `)
    expect(patchedComponent?.content).toMatchInlineSnapshot(`
      "import { getUser } from './api'

      export function UserComponent({ userId }: { userId: number }) {
        const user = getUser(userId)
        return <div>{user.name} ({user.email})</div>
      }"
    `)
    expect(patchedComponent?.patch).toMatchInlineSnapshot(`"◼︎=005|  return <div>{user.name} ({user.email})</div>"`)
  })

  it('refactors two files in a related way (rename function and update usage)', async () => {
    const utilsFile: File = {
      path: 'src/utils.ts',
      name: 'utils.ts',
      content: `export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0)
}`,
    }

    const appFile: File = {
      path: 'src/app.ts',
      name: 'app.ts',
      content: `import { calculateTotal } from './utils'

const prices = [10, 20, 30]
const total = calculateTotal(prices)
console.log(total)`,
    }

    const result = await zai
      .patch([utilsFile, appFile], 'rename the calculateTotal function to computeSum and update all usages')
      .result()

    expect(result.output).toHaveLength(2)
    const patchedUtils = result.output.find((f) => f.name === 'utils.ts')
    const patchedApp = result.output.find((f) => f.name === 'app.ts')

    // Utils should have new name
    expect(patchedUtils?.content).toContain('computeSum')
    expect(patchedUtils?.content).not.toContain('calculateTotal')
    // App should import and use new name
    expect(patchedApp?.content).toContain('computeSum')
    expect(patchedApp?.content).not.toContain('calculateTotal')

    expect(patchedUtils?.content).toMatchInlineSnapshot(`
      "export function computeSum(items: number[]): number {
        return items.reduce((sum, item) => sum + item, 0)
      }"
    `)
    expect(patchedUtils?.patch).toMatchInlineSnapshot(`"◼︎=001|export function computeSum(items: number[]): number {"`)
    expect(patchedApp?.content).toMatchInlineSnapshot(`
      "import { computeSum } from './utils'

      const prices = [10, 20, 30]
      const total = computeSum(prices)
      console.log(total)"
    `)
    expect(patchedApp?.patch).toMatchInlineSnapshot(`
      "◼︎=001|import { computeSum } from './utils'
      ◼︎=004|const total = computeSum(prices)"
    `)
  })

  it('leaves files unchanged when they do not need changes (5 files, only 2 need changes)', async () => {
    const asyncFile1: File = {
      path: 'src/api1.ts',
      name: 'api1.ts',
      content: `export async function fetchUser(id: number) {
  const response = await fetch('/api/user/' + id)
  return response.json()
}`,
    }

    const asyncFile2: File = {
      path: 'src/api2.ts',
      name: 'api2.ts',
      content: `export async function saveData(data: any) {
  const response = await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
  return response.json()
}`,
    }

    const syncFile1: File = {
      path: 'src/utils.ts',
      name: 'utils.ts',
      content: `export function formatName(first: string, last: string) {
  return first + ' ' + last
}`,
    }

    const syncFile2: File = {
      path: 'src/constants.ts',
      name: 'constants.ts',
      content: `export const API_URL = 'https://api.example.com'
export const TIMEOUT = 5000`,
    }

    const configFile: File = {
      path: 'config.json',
      name: 'config.json',
      content: `{
  "name": "app",
  "version": "1.0.0"
}`,
    }

    const files = [asyncFile1, asyncFile2, syncFile1, syncFile2, configFile]
    const result = await zai
      .patch(files, 'add try-catch error handling to all async functions that call fetch')
      .result()

    expect(result.output).toHaveLength(5)

    // Find the patched files
    const patchedApi1 = result.output.find((f) => f.name === 'api1.ts')
    const patchedApi2 = result.output.find((f) => f.name === 'api2.ts')
    const patchedUtils = result.output.find((f) => f.name === 'utils.ts')
    const patchedConstants = result.output.find((f) => f.name === 'constants.ts')
    const patchedConfig = result.output.find((f) => f.name === 'config.json')

    // Async files should have try-catch
    expect(patchedApi1?.content).toContain('try')
    expect(patchedApi1?.content).toContain('catch')
    expect(patchedApi2?.content).toContain('try')
    expect(patchedApi2?.content).toContain('catch')

    // Sync files and config should be unchanged
    expect(patchedUtils?.patch).toBe('')
    expect(patchedConstants?.patch).toBe('')
    expect(patchedConfig?.patch).toBe('')

    // Check that async files have patches
    expect(patchedApi1?.patch).not.toBe('')
    expect(patchedApi2?.patch).not.toBe('')

    expect(patchedApi1?.content).toMatchInlineSnapshot(`
      "export async function fetchUser(id: number) {
      try {
        const response = await fetch('/api/user/' + id)
        return response.json()
      } catch (error) {
        console.error('Error fetching user:', error)
        throw error
      }
      }"
    `)
    expect(patchedApi1?.patch).toMatchInlineSnapshot(`
      "◼︎=2-3|try {
        const response = await fetch('/api/user/' + id)
        return response.json()
      } catch (error) {
        console.error('Error fetching user:', error)
        throw error
      }"
    `)
    expect(patchedApi2?.content).toMatchInlineSnapshot(`
      "export async function saveData(data: any) {
      try {
        const response = await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
        return response.json()
      } catch (error) {
        console.error('Error saving data:', error)
        throw error
      }
      }"
    `)
    expect(patchedApi2?.patch).toMatchInlineSnapshot(`
      "◼︎=2-3|try {
        const response = await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
        return response.json()
      } catch (error) {
        console.error('Error saving data:', error)
        throw error
      }"
    `)
  })

  it('patches a file with many lines (500 lines) updating ~50 lines spread throughout', async () => {
    // Create a file with 500 lines where every 10th line has a TODO comment
    const lines: string[] = []
    for (let i = 0; i < 500; i++) {
      if (i % 10 === 0) {
        lines.push(`  // TODO: implement feature ${i / 10}`)
      } else {
        lines.push(`  const var${i} = ${i}`)
      }
    }

    const largeFile: File = {
      path: 'src/large.ts',
      name: 'large.ts',
      content: `function largeFunction() {\n${lines.join('\n')}\n}`,
    }

    const result = await zai.patch([largeFile], 'replace all TODO comments with FIXME comments').result()

    expect(result.output).toHaveLength(1)
    const patched = result.output[0]

    // All TODO should be replaced with FIXME
    expect(patched.content).not.toContain('TODO')
    expect(patched.content).toContain('FIXME')

    // Should still have the function structure
    expect(patched.content).toContain('function largeFunction()')
    expect(patched.content).toContain('const var1 = 1')
    expect(patched.content).toContain('const var499 = 499')

    // Count FIXME occurrences (should be 50)
    const fixmeCount = (patched.content.match(/FIXME/g) || []).length
    expect(fixmeCount).toBe(50)

    // Patch should have replacements
    expect(patched.patch).toContain('FIXME')
    expect(patched.patch).not.toBe('')

    expect(patched.content).toMatchInlineSnapshot(`
      "function largeFunction() {
        // FIXME: implement feature 0
        const var1 = 1
        const var2 = 2
        const var3 = 3
        const var4 = 4
        const var5 = 5
        const var6 = 6
        const var7 = 7
        const var8 = 8
        const var9 = 9
        // FIXME: implement feature 1
        const var11 = 11
        const var12 = 12
        const var13 = 13
        const var14 = 14
        const var15 = 15
        const var16 = 16
        const var17 = 17
        const var18 = 18
        const var19 = 19
        // FIXME: implement feature 2
        const var21 = 21
        const var22 = 22
        const var23 = 23
        const var24 = 24
        const var25 = 25
        const var26 = 26
        const var27 = 27
        const var28 = 28
        const var29 = 29
        // FIXME: implement feature 3
        const var31 = 31
        const var32 = 32
        const var33 = 33
        const var34 = 34
        const var35 = 35
        const var36 = 36
        const var37 = 37
        const var38 = 38
        const var39 = 39
        // FIXME: implement feature 4
        const var41 = 41
        const var42 = 42
        const var43 = 43
        const var44 = 44
        const var45 = 45
        const var46 = 46
        const var47 = 47
        const var48 = 48
        const var49 = 49
        // FIXME: implement feature 5
        const var51 = 51
        const var52 = 52
        const var53 = 53
        const var54 = 54
        const var55 = 55
        const var56 = 56
        const var57 = 57
        const var58 = 58
        const var59 = 59
        // FIXME: implement feature 6
        const var61 = 61
        const var62 = 62
        const var63 = 63
        const var64 = 64
        const var65 = 65
        const var66 = 66
        const var67 = 67
        const var68 = 68
        const var69 = 69
        // FIXME: implement feature 7
        const var71 = 71
        const var72 = 72
        const var73 = 73
        const var74 = 74
        const var75 = 75
        const var76 = 76
        const var77 = 77
        const var78 = 78
        const var79 = 79
        // FIXME: implement feature 8
        const var81 = 81
        const var82 = 82
        const var83 = 83
        const var84 = 84
        const var85 = 85
        const var86 = 86
        const var87 = 87
        const var88 = 88
        const var89 = 89
        // FIXME: implement feature 9
        const var91 = 91
        const var92 = 92
        const var93 = 93
        const var94 = 94
        const var95 = 95
        const var96 = 96
        const var97 = 97
        const var98 = 98
        const var99 = 99
        // FIXME: implement feature 10
        const var101 = 101
        const var102 = 102
        const var103 = 103
        const var104 = 104
        const var105 = 105
        const var106 = 106
        const var107 = 107
        const var108 = 108
        const var109 = 109
        // FIXME: implement feature 11
        const var111 = 111
        const var112 = 112
        const var113 = 113
        const var114 = 114
        const var115 = 115
        const var116 = 116
        const var117 = 117
        const var118 = 118
        const var119 = 119
        // FIXME: implement feature 12
        const var121 = 121
        const var122 = 122
        const var123 = 123
        const var124 = 124
        const var125 = 125
        const var126 = 126
        const var127 = 127
        const var128 = 128
        const var129 = 129
        // FIXME: implement feature 13
        const var131 = 131
        const var132 = 132
        const var133 = 133
        const var134 = 134
        const var135 = 135
        const var136 = 136
        const var137 = 137
        const var138 = 138
        const var139 = 139
        // FIXME: implement feature 14
        const var141 = 141
        const var142 = 142
        const var143 = 143
        const var144 = 144
        const var145 = 145
        const var146 = 146
        const var147 = 147
        const var148 = 148
        const var149 = 149
        // FIXME: implement feature 15
        const var151 = 151
        const var152 = 152
        const var153 = 153
        const var154 = 154
        const var155 = 155
        const var156 = 156
        const var157 = 157
        const var158 = 158
        const var159 = 159
        // FIXME: implement feature 16
        const var161 = 161
        const var162 = 162
        const var163 = 163
        const var164 = 164
        const var165 = 165
        const var166 = 166
        const var167 = 167
        const var168 = 168
        const var169 = 169
        // FIXME: implement feature 17
        const var171 = 171
        const var172 = 172
        const var173 = 173
        const var174 = 174
        const var175 = 175
        const var176 = 176
        const var177 = 177
        const var178 = 178
        const var179 = 179
        // FIXME: implement feature 18
        const var181 = 181
        const var182 = 182
        const var183 = 183
        const var184 = 184
        const var185 = 185
        const var186 = 186
        const var187 = 187
        const var188 = 188
        const var189 = 189
        // FIXME: implement feature 19
        const var191 = 191
        const var192 = 192
        const var193 = 193
        const var194 = 194
        const var195 = 195
        const var196 = 196
        const var197 = 197
        const var198 = 198
        const var199 = 199
        // FIXME: implement feature 20
        const var201 = 201
        const var202 = 202
        const var203 = 203
        const var204 = 204
        const var205 = 205
        const var206 = 206
        const var207 = 207
        const var208 = 208
        const var209 = 209
        // FIXME: implement feature 21
        const var211 = 211
        const var212 = 212
        const var213 = 213
        const var214 = 214
        const var215 = 215
        const var216 = 216
        const var217 = 217
        const var218 = 218
        const var219 = 219
        // FIXME: implement feature 22
        const var221 = 221
        const var222 = 222
        const var223 = 223
        const var224 = 224
        const var225 = 225
        const var226 = 226
        const var227 = 227
        const var228 = 228
        const var229 = 229
        // FIXME: implement feature 23
        const var231 = 231
        const var232 = 232
        const var233 = 233
        const var234 = 234
        const var235 = 235
        const var236 = 236
        const var237 = 237
        const var238 = 238
        const var239 = 239
        // FIXME: implement feature 24
        const var241 = 241
        const var242 = 242
        const var243 = 243
        const var244 = 244
        const var245 = 245
        const var246 = 246
        const var247 = 247
        const var248 = 248
        const var249 = 249
        // FIXME: implement feature 25
        const var251 = 251
        const var252 = 252
        const var253 = 253
        const var254 = 254
        const var255 = 255
        const var256 = 256
        const var257 = 257
        const var258 = 258
        const var259 = 259
        // FIXME: implement feature 26
        const var261 = 261
        const var262 = 262
        const var263 = 263
        const var264 = 264
        const var265 = 265
        const var266 = 266
        const var267 = 267
        const var268 = 268
        const var269 = 269
        // FIXME: implement feature 27
        const var271 = 271
        const var272 = 272
        const var273 = 273
        const var274 = 274
        const var275 = 275
        const var276 = 276
        const var277 = 277
        const var278 = 278
        const var279 = 279
        // FIXME: implement feature 28
        const var281 = 281
        const var282 = 282
        const var283 = 283
        const var284 = 284
        const var285 = 285
        const var286 = 286
        const var287 = 287
        const var288 = 288
        const var289 = 289
        // FIXME: implement feature 29
        const var291 = 291
        const var292 = 292
        const var293 = 293
        const var294 = 294
        const var295 = 295
        const var296 = 296
        const var297 = 297
        const var298 = 298
        const var299 = 299
        // FIXME: implement feature 30
        const var301 = 301
        const var302 = 302
        const var303 = 303
        const var304 = 304
        const var305 = 305
        const var306 = 306
        const var307 = 307
        const var308 = 308
        const var309 = 309
        // FIXME: implement feature 31
        const var311 = 311
        const var312 = 312
        const var313 = 313
        const var314 = 314
        const var315 = 315
        const var316 = 316
        const var317 = 317
        const var318 = 318
        const var319 = 319
        // FIXME: implement feature 32
        const var321 = 321
        const var322 = 322
        const var323 = 323
        const var324 = 324
        const var325 = 325
        const var326 = 326
        const var327 = 327
        const var328 = 328
        const var329 = 329
        // FIXME: implement feature 33
        const var331 = 331
        const var332 = 332
        const var333 = 333
        const var334 = 334
        const var335 = 335
        const var336 = 336
        const var337 = 337
        const var338 = 338
        const var339 = 339
        // FIXME: implement feature 34
        const var341 = 341
        const var342 = 342
        const var343 = 343
        const var344 = 344
        const var345 = 345
        const var346 = 346
        const var347 = 347
        const var348 = 348
        const var349 = 349
        // FIXME: implement feature 35
        const var351 = 351
        const var352 = 352
        const var353 = 353
        const var354 = 354
        const var355 = 355
        const var356 = 356
        const var357 = 357
        const var358 = 358
        const var359 = 359
        // FIXME: implement feature 36
        const var361 = 361
        const var362 = 362
        const var363 = 363
        const var364 = 364
        const var365 = 365
        const var366 = 366
        const var367 = 367
        const var368 = 368
        const var369 = 369
        // FIXME: implement feature 37
        const var371 = 371
        const var372 = 372
        const var373 = 373
        const var374 = 374
        const var375 = 375
        const var376 = 376
        const var377 = 377
        const var378 = 378
        const var379 = 379
        // FIXME: implement feature 38
        const var381 = 381
        const var382 = 382
        const var383 = 383
        const var384 = 384
        const var385 = 385
        const var386 = 386
        const var387 = 387
        const var388 = 388
        const var389 = 389
        // FIXME: implement feature 39
        const var391 = 391
        const var392 = 392
        const var393 = 393
        const var394 = 394
        const var395 = 395
        const var396 = 396
        const var397 = 397
        const var398 = 398
        const var399 = 399
        // FIXME: implement feature 40
        const var401 = 401
        const var402 = 402
        const var403 = 403
        const var404 = 404
        const var405 = 405
        const var406 = 406
        const var407 = 407
        const var408 = 408
        const var409 = 409
        // FIXME: implement feature 41
        const var411 = 411
        const var412 = 412
        const var413 = 413
        const var414 = 414
        const var415 = 415
        const var416 = 416
        const var417 = 417
        const var418 = 418
        const var419 = 419
        // FIXME: implement feature 42
        const var421 = 421
        const var422 = 422
        const var423 = 423
        const var424 = 424
        const var425 = 425
        const var426 = 426
        const var427 = 427
        const var428 = 428
        const var429 = 429
        // FIXME: implement feature 43
        const var431 = 431
        const var432 = 432
        const var433 = 433
        const var434 = 434
        const var435 = 435
        const var436 = 436
        const var437 = 437
        const var438 = 438
        const var439 = 439
        // FIXME: implement feature 44
        const var441 = 441
        const var442 = 442
        const var443 = 443
        const var444 = 444
        const var445 = 445
        const var446 = 446
        const var447 = 447
        const var448 = 448
        const var449 = 449
        // FIXME: implement feature 45
        const var451 = 451
        const var452 = 452
        const var453 = 453
        const var454 = 454
        const var455 = 455
        const var456 = 456
        const var457 = 457
        const var458 = 458
        const var459 = 459
        // FIXME: implement feature 46
        const var461 = 461
        const var462 = 462
        const var463 = 463
        const var464 = 464
        const var465 = 465
        const var466 = 466
        const var467 = 467
        const var468 = 468
        const var469 = 469
        // FIXME: implement feature 47
        const var471 = 471
        const var472 = 472
        const var473 = 473
        const var474 = 474
        const var475 = 475
        const var476 = 476
        const var477 = 477
        const var478 = 478
        const var479 = 479
        // FIXME: implement feature 48
        const var481 = 481
        const var482 = 482
        const var483 = 483
        const var484 = 484
        const var485 = 485
        const var486 = 486
        const var487 = 487
        const var488 = 488
        const var489 = 489
        // FIXME: implement feature 49
        const var491 = 491
        const var492 = 492
        const var493 = 493
        const var494 = 494
        const var495 = 495
        const var496 = 496
        const var497 = 497
        const var498 = 498
        const var499 = 499
      }"
    `)
    expect(patched.patch).toMatchInlineSnapshot(`
      "◼︎=2|  // FIXME: implement feature 0
      ◼︎=12|  // FIXME: implement feature 1
      ◼︎=22|  // FIXME: implement feature 2
      ◼︎=32|  // FIXME: implement feature 3
      ◼︎=42|  // FIXME: implement feature 4
      ◼︎=52|  // FIXME: implement feature 5
      ◼︎=62|  // FIXME: implement feature 6
      ◼︎=72|  // FIXME: implement feature 7
      ◼︎=82|  // FIXME: implement feature 8
      ◼︎=92|  // FIXME: implement feature 9
      ◼︎=102|  // FIXME: implement feature 10
      ◼︎=112|  // FIXME: implement feature 11
      ◼︎=122|  // FIXME: implement feature 12
      ◼︎=132|  // FIXME: implement feature 13
      ◼︎=142|  // FIXME: implement feature 14
      ◼︎=152|  // FIXME: implement feature 15
      ◼︎=162|  // FIXME: implement feature 16
      ◼︎=172|  // FIXME: implement feature 17
      ◼︎=182|  // FIXME: implement feature 18
      ◼︎=192|  // FIXME: implement feature 19
      ◼︎=202|  // FIXME: implement feature 20
      ◼︎=212|  // FIXME: implement feature 21
      ◼︎=222|  // FIXME: implement feature 22
      ◼︎=232|  // FIXME: implement feature 23
      ◼︎=242|  // FIXME: implement feature 24
      ◼︎=252|  // FIXME: implement feature 25
      ◼︎=262|  // FIXME: implement feature 26
      ◼︎=272|  // FIXME: implement feature 27
      ◼︎=282|  // FIXME: implement feature 28
      ◼︎=292|  // FIXME: implement feature 29
      ◼︎=302|  // FIXME: implement feature 30
      ◼︎=312|  // FIXME: implement feature 31
      ◼︎=322|  // FIXME: implement feature 32
      ◼︎=332|  // FIXME: implement feature 33
      ◼︎=342|  // FIXME: implement feature 34
      ◼︎=352|  // FIXME: implement feature 35
      ◼︎=362|  // FIXME: implement feature 36
      ◼︎=372|  // FIXME: implement feature 37
      ◼︎=382|  // FIXME: implement feature 38
      ◼︎=392|  // FIXME: implement feature 39
      ◼︎=402|  // FIXME: implement feature 40
      ◼︎=412|  // FIXME: implement feature 41
      ◼︎=422|  // FIXME: implement feature 42
      ◼︎=432|  // FIXME: implement feature 43
      ◼︎=442|  // FIXME: implement feature 44
      ◼︎=452|  // FIXME: implement feature 45
      ◼︎=462|  // FIXME: implement feature 46
      ◼︎=472|  // FIXME: implement feature 47
      ◼︎=482|  // FIXME: implement feature 48
      ◼︎=492|  // FIXME: implement feature 49"
    `)
  })

  it('refactors a function in a large file (200 lines): renames it, changes parameters, updates all usages', async () => {
    // Create a 200-line file with a function defined at the top and used throughout
    const lines: string[] = []
    lines.push('// Utility functions')
    lines.push('function processItem(item: string): string {')
    lines.push('  return item.toUpperCase()')
    lines.push('}')
    lines.push('')
    lines.push('// Main code')

    // Add 194 more lines with multiple usages of processItem
    for (let i = 0; i < 194; i++) {
      if (i % 20 === 0) {
        lines.push(`const result${i} = processItem('value${i}')`)
      } else if (i % 30 === 0) {
        lines.push(`console.log(processItem('test${i}'))`)
      } else {
        lines.push(`const data${i} = 'some data ${i}'`)
      }
    }

    const largeFile: File = {
      path: 'src/processor.ts',
      name: 'processor.ts',
      content: lines.join('\n'),
    }

    const result = await zai
      .patch(
        [largeFile],
        'rename processItem to transformText and add a second parameter "options: { uppercase: boolean }" with default value { uppercase: false }. Update all function calls to use the new signature. For string where number value in the 1st param is above 100, make it uppercase.'
      )
      .result()

    expect(result.output).toHaveLength(1)
    const patched = result.output[0]

    // Should not have old function name
    expect(patched.content).not.toContain('processItem')

    // Should have new function name
    expect(patched.content).toContain('transformText')

    // Should have the new parameter
    expect(patched.content).toContain('options')
    expect(patched.content).toContain('uppercase')

    // All usages should be updated
    const transformTextCount = (patched.content.match(/transformText/g) || []).length
    expect(transformTextCount).toBeGreaterThan(1) // Function definition + usages

    // Patch should not be empty
    expect(patched.patch).not.toBe('')

    expect(patched.content).toMatchInlineSnapshot(`
      "// Utility functions
      function transformText(item: string, options: { uppercase: boolean } = { uppercase: false }): string {
        return options.uppercase ? item.toUpperCase() : item
      }

      // Main code
      const result0 = transformText('value0', { uppercase: false })
      const data1 = 'some data 1'
      const data2 = 'some data 2'
      const data3 = 'some data 3'
      const data4 = 'some data 4'
      const data5 = 'some data 5'
      const data6 = 'some data 6'
      const data7 = 'some data 7'
      const data8 = 'some data 8'
      const data9 = 'some data 9'
      const data10 = 'some data 10'
      const data11 = 'some data 11'
      const data12 = 'some data 12'
      const data13 = 'some data 13'
      const data14 = 'some data 14'
      const data15 = 'some data 15'
      const data16 = 'some data 16'
      const data17 = 'some data 17'
      const data18 = 'some data 18'
      const data19 = 'some data 19'
      const result20 = transformText('value20', { uppercase: false })
      const data21 = 'some data 21'
      const data22 = 'some data 22'
      const data23 = 'some data 23'
      const data24 = 'some data 24'
      const data25 = 'some data 25'
      const data26 = 'some data 26'
      const data27 = 'some data 27'
      const data28 = 'some data 28'
      const data29 = 'some data 29'
      console.log(transformText('test30', { uppercase: false }))
      const data31 = 'some data 31'
      const data32 = 'some data 32'
      const data33 = 'some data 33'
      const data34 = 'some data 34'
      const data35 = 'some data 35'
      const data36 = 'some data 36'
      const data37 = 'some data 37'
      const data38 = 'some data 38'
      const data39 = 'some data 39'
      const result40 = transformText('value40', { uppercase: false })
      const data41 = 'some data 41'
      const data42 = 'some data 42'
      const data43 = 'some data 43'
      const data44 = 'some data 44'
      const data45 = 'some data 45'
      const data46 = 'some data 46'
      const data47 = 'some data 47'
      const data48 = 'some data 48'
      const data49 = 'some data 49'
      const data50 = 'some data 50'
      const data51 = 'some data 51'
      const data52 = 'some data 52'
      const data53 = 'some data 53'
      const data54 = 'some data 54'
      const data55 = 'some data 55'
      const data56 = 'some data 56'
      const data57 = 'some data 57'
      const data58 = 'some data 58'
      const data59 = 'some data 59'
      const result60 = transformText('value60', { uppercase: false })
      const data61 = 'some data 61'
      const data62 = 'some data 62'
      const data63 = 'some data 63'
      const data64 = 'some data 64'
      const data65 = 'some data 65'
      const data66 = 'some data 66'
      const data67 = 'some data 67'
      const data68 = 'some data 68'
      const data69 = 'some data 69'
      const data70 = 'some data 70'
      const data71 = 'some data 71'
      const data72 = 'some data 72'
      const data73 = 'some data 73'
      const data74 = 'some data 74'
      const data75 = 'some data 75'
      const data76 = 'some data 76'
      const data77 = 'some data 77'
      const data78 = 'some data 78'
      const data79 = 'some data 79'
      const result80 = transformText('value80', { uppercase: false })
      const data81 = 'some data 81'
      const data82 = 'some data 82'
      const data83 = 'some data 83'
      const data84 = 'some data 84'
      const data85 = 'some data 85'
      const data86 = 'some data 86'
      const data87 = 'some data 87'
      const data88 = 'some data 88'
      const data89 = 'some data 89'
      console.log(transformText('test90', { uppercase: false }))
      const data91 = 'some data 91'
      const data92 = 'some data 92'
      const data93 = 'some data 93'
      const data94 = 'some data 94'
      const data95 = 'some data 95'
      const data96 = 'some data 96'
      const data97 = 'some data 97'
      const data98 = 'some data 98'
      const data99 = 'some data 99'
      const result100 = transformText('value100', { uppercase: false })
      const data101 = 'some data 101'
      const data102 = 'some data 102'
      const data103 = 'some data 103'
      const data104 = 'some data 104'
      const data105 = 'some data 105'
      const data106 = 'some data 106'
      const data107 = 'some data 107'
      const data108 = 'some data 108'
      const data109 = 'some data 109'
      const data110 = 'some data 110'
      const data111 = 'some data 111'
      const data112 = 'some data 112'
      const data113 = 'some data 113'
      const data114 = 'some data 114'
      const data115 = 'some data 115'
      const data116 = 'some data 116'
      const data117 = 'some data 117'
      const data118 = 'some data 118'
      const data119 = 'some data 119'
      const result120 = transformText('value120', { uppercase: true })
      const data121 = 'some data 121'
      const data122 = 'some data 122'
      const data123 = 'some data 123'
      const data124 = 'some data 124'
      const data125 = 'some data 125'
      const data126 = 'some data 126'
      const data127 = 'some data 127'
      const data128 = 'some data 128'
      const data129 = 'some data 129'
      const data130 = 'some data 130'
      const data131 = 'some data 131'
      const data132 = 'some data 132'
      const data133 = 'some data 133'
      const data134 = 'some data 134'
      const data135 = 'some data 135'
      const data136 = 'some data 136'
      const data137 = 'some data 137'
      const data138 = 'some data 138'
      const data139 = 'some data 139'
      const result140 = transformText('value140', { uppercase: true })
      const data141 = 'some data 141'
      const data142 = 'some data 142'
      const data143 = 'some data 143'
      const data144 = 'some data 144'
      const data145 = 'some data 145'
      const data146 = 'some data 146'
      const data147 = 'some data 147'
      const data148 = 'some data 148'
      const data149 = 'some data 149'
      console.log(transformText('test150', { uppercase: true }))
      const data151 = 'some data 151'
      const data152 = 'some data 152'
      const data153 = 'some data 153'
      const data154 = 'some data 154'
      const data155 = 'some data 155'
      const data156 = 'some data 156'
      const data157 = 'some data 157'
      const data158 = 'some data 158'
      const data159 = 'some data 159'
      const result160 = transformText('value160', { uppercase: true })
      const data161 = 'some data 161'
      const data162 = 'some data 162'
      const data163 = 'some data 163'
      const data164 = 'some data 164'
      const data165 = 'some data 165'
      const data166 = 'some data 166'
      const data167 = 'some data 167'
      const data168 = 'some data 168'
      const data169 = 'some data 169'
      const data170 = 'some data 170'
      const data171 = 'some data 171'
      const data172 = 'some data 172'
      const data173 = 'some data 173'
      const data174 = 'some data 174'
      const data175 = 'some data 175'
      const data176 = 'some data 176'
      const data177 = 'some data 177'
      const data178 = 'some data 178'
      const data179 = 'some data 179'
      const result180 = transformText('value180', { uppercase: true })
      const data181 = 'some data 181'
      const data182 = 'some data 182'
      const data183 = 'some data 183'
      const data184 = 'some data 184'
      const data185 = 'some data 185'
      const data186 = 'some data 186'
      const data187 = 'some data 187'
      const data188 = 'some data 188'
      const data189 = 'some data 189'
      const data190 = 'some data 190'
      const data191 = 'some data 191'
      const data192 = 'some data 192'
      const data193 = 'some data 193'"
    `)
    expect(patched.patch).toMatchInlineSnapshot(`
      "◼︎=2-4|function transformText(item: string, options: { uppercase: boolean } = { uppercase: false }): string {
        return options.uppercase ? item.toUpperCase() : item
      }
      ◼︎=7|const result0 = transformText('value0', { uppercase: false })
      ◼︎=27|const result20 = transformText('value20', { uppercase: false })
      ◼︎=37|console.log(transformText('test30', { uppercase: false }))
      ◼︎=47|const result40 = transformText('value40', { uppercase: false })
      ◼︎=67|const result60 = transformText('value60', { uppercase: false })
      ◼︎=87|const result80 = transformText('value80', { uppercase: false })
      ◼︎=97|console.log(transformText('test90', { uppercase: false }))
      ◼︎=107|const result100 = transformText('value100', { uppercase: false })
      ◼︎=127|const result120 = transformText('value120', { uppercase: true })
      ◼︎=147|const result140 = transformText('value140', { uppercase: true })
      ◼︎=157|console.log(transformText('test150', { uppercase: true }))
      ◼︎=167|const result160 = transformText('value160', { uppercase: true })
      ◼︎=187|const result180 = transformText('value180', { uppercase: true })"
    `)
  })

  it('handles large file with chunking enabled (single file > maxTokensPerChunk)', async () => {
    // Create a very large file (2000 lines)
    const lines: string[] = []
    for (let i = 0; i < 2000; i++) {
      if (i % 100 === 0) {
        lines.push(`  // TODO: section ${i / 100}`)
      } else {
        lines.push(`  const variable${i} = ${i}`)
      }
    }

    const veryLargeFile: File = {
      path: 'src/giant.ts',
      name: 'giant.ts',
      content: `function giant() {\n${lines.join('\n')}\n}`,
    }

    const result = await zai
      .patch([veryLargeFile], 'replace all TODO comments with DONE comments', {
        maxTokensPerChunk: 5000, // Force chunking
      })
      .result()

    expect(result.output).toHaveLength(1)
    const patched = result.output[0]

    // Verify chunking occurred - multiple LLM calls were made
    expect(result.usage.requests.requests).toBeGreaterThan(1)
    console.log(`Chunking test: ${result.usage.requests.requests} LLM calls made`)

    // All TODO should be replaced with DONE
    expect(patched.content).not.toContain('TODO')
    expect(patched.content).toContain('DONE')

    // Should still have the function structure
    expect(patched.content).toContain('function giant()')

    // Count DONE occurrences
    const doneCount = (patched.content.match(/DONE/g) || []).length
    expect(doneCount).toBe(20)

    expect(patched.patch).toContain('DONE')
    expect(patched.patch).not.toBe('')
  })

  it('handles multiple files with chunking (total files > maxTokensPerChunk)', async () => {
    // Create 5 moderately sized files
    const files: File[] = []
    for (let fileIdx = 0; fileIdx < 5; fileIdx++) {
      const lines: string[] = []
      for (let i = 0; i < 300; i++) {
        if (i % 50 === 0) {
          lines.push(`  // TODO: feature ${fileIdx}-${i / 50}`)
        } else {
          lines.push(`  const var${i} = ${i}`)
        }
      }

      files.push({
        path: `src/file${fileIdx}.ts`,
        name: `file${fileIdx}.ts`,
        content: `function file${fileIdx}() {\n${lines.join('\n')}\n}`,
      })
    }

    const result = await zai
      .patch(files, 'replace all TODO comments with COMPLETED comments', {
        maxTokensPerChunk: 8000, // Force batching
      })
      .result()

    expect(result.output).toHaveLength(5)

    // Verify batching occurred - multiple LLM calls were made
    expect(result.usage.requests.requests).toBeGreaterThan(1)
    console.log(`Batching test: ${result.usage.requests.requests} LLM calls made`)

    // Check that all files were processed
    for (let i = 0; i < 5; i++) {
      const patched = result.output.find((f) => f.name === `file${i}.ts`)
      expect(patched).toBeDefined()
      expect(patched?.content).not.toContain('TODO')
      expect(patched?.content).toContain('COMPLETED')

      // Each file should have 6 COMPLETED comments
      const completedCount = (patched?.content.match(/COMPLETED/g) || []).length
      expect(completedCount).toBe(6)
    }
  })
})

describe.sequential('zai.learn.patch', { timeout: 60_000 }, () => {
  const client = getClient()
  let tableName = 'ZaiTestPatchInternalTable'
  let taskId = 'patch'
  let zai = getZai()

  beforeEach(async () => {
    zai = getZai().with({
      activeLearning: {
        enable: true,
        taskId,
        tableName,
      },
    })
  })

  afterEach(async () => {
    try {
      await client.deleteTableRows({ table: tableName, deleteAllRows: true })
    } catch (err) {}
  })

  afterAll(async () => {
    try {
      await client.deleteTable({ table: tableName })
    } catch (err) {}
  })

  it('learns patch patterns from examples', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const testFile: File = {
      path: 'component.tsx',
      name: 'component.tsx',
      content: 'export const Component = () => <div>Test</div>',
    }

    // First call - learns the pattern
    const first = await zai.learn(taskId).patch([testFile], 'add TypeScript FC type').result()

    let rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBeGreaterThanOrEqual(1)

    // Save an approved example with a specific pattern
    await adapter.saveExample({
      key: 'example1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.patch',
      instructions: 'add TypeScript FC type',
      input: [
        {
          path: 'test.tsx',
          name: 'test.tsx',
          content: 'export const MyComponent = () => <div>Hello</div>',
        },
      ],
      output: [
        {
          path: 'test.tsx',
          name: 'test.tsx',
          content: 'import { FC } from "react"\n\nexport const MyComponent: FC = () => <div>Hello</div>',
        },
      ],
      metadata,
      status: 'approved',
    })

    // Second call - should use the learned pattern
    const second = await zai.learn(taskId).patch([testFile], 'add TypeScript FC type').result()

    rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBe(2)

    expect(second.output[0].content).toContain('FC')
    expect(second.output[0].content).toContain('react')

    expect(second.output[0].patch).toMatchInlineSnapshot(`
      "◼︎<1|import React from 'react';
      ◼︎=1|export const Component: React.FC = () => <div>Test</div>"
    `)
  })
})
