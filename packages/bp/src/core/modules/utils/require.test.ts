import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import tmp from 'tmp'

import { explodePath, requireAtPaths } from './require'

describe('explodePath', () => {
  it('absolute location', () => {
    const result = explodePath('/a/b/c/d'.replace('/', path.sep))

    expect(result[0]).toEqual(path.resolve('/a/b/c/d'))
    expect(result[1]).toEqual(path.resolve('/a/b/c/d/node_production_modules'))
    expect(result[2]).toEqual(path.resolve('/a/b/c/d/node_modules'))

    expect(result[3]).toEqual(path.resolve('/a/b/c/node_production_modules'))
    expect(result[4]).toEqual(path.resolve('/a/b/c/node_modules'))

    expect(result[5]).toEqual(path.resolve('/a/b/node_production_modules'))
    expect(result[6]).toEqual(path.resolve('/a/b/node_modules'))

    expect(result[7]).toEqual(path.resolve('/a/node_production_modules'))
    expect(result[8]).toEqual(path.resolve('/a/node_modules'))

    expect(result[result.length - 2]).toEqual(path.resolve('/node_production_modules'))
    expect(result[result.length - 1]).toEqual(path.resolve('/node_modules'))
  })

  it('relative location', () => {
    const result = explodePath('./a/b/c/d'.replace('/', path.sep))

    expect(result[0]).toEqual(path.join('./a/b/c/d'))
    expect(result[1]).toEqual(path.join('./a/b/c/d/node_production_modules'))
    expect(result[2]).toEqual(path.join('./a/b/c/d/node_modules'))

    expect(result[3]).toEqual(path.join('./a/b/c/node_production_modules'))
    expect(result[4]).toEqual(path.join('./a/b/c/node_modules'))

    expect(result[result.length - 2]).toEqual(path.join('./node_production_modules'))
    expect(result[result.length - 1]).toEqual(path.join('./node_modules'))
  })
})

describe('requireAtPaths', () => {
  const fileContent = name => `module.exports = "${name}"`
  const pkgJson = '{ "main": "src/main.js" }'
  let base1: tmp.SynchrounousResult

  beforeEach(() => {
    base1 = tmp.dirSync()
    mkdirp.sync(path.join(base1.name, 'a/b/c/node_modules/hello'))
    mkdirp.sync(path.join(base1.name, 'a/b/c/node_production_modules/hello/src'))
    fs.writeFileSync(path.join(base1.name, 'a/b/c/index.js'), fileContent('abc index'))
    fs.writeFileSync(path.join(base1.name, 'a/b/c.js'), fileContent('c js'))
    fs.writeFileSync(path.join(base1.name, 'a/b/c/node_modules/hello/index.js'), fileContent('hello index'))
    fs.writeFileSync(path.join(base1.name, 'a/b/c/node_production_modules/hello/package.json'), pkgJson)
    fs.writeFileSync(path.join(base1.name, 'a/b/c/node_production_modules/hello/src/main.js'), fileContent('hello pkg'))
  })

  it('priority respected', () => {
    const res1 = requireAtPaths('hello', [path.join(base1.name, 'a/b/c')])
    fs.unlinkSync(path.join(base1.name, 'a/b/c/node_production_modules/hello/package.json'))
    const res2 = requireAtPaths('hello', [path.join(base1.name, 'a/b/c')])
    const res3 = requireAtPaths('c', [path.join(base1.name, 'a/b/c')])
    const res4 = requireAtPaths('c', [path.join(base1.name, 'a/b')])

    expect(res1).toEqual('hello pkg')
    expect(res2).toEqual('hello index')
    expect(res3).toEqual('abc index')
    expect(res4).toEqual('c js')
  })
})
