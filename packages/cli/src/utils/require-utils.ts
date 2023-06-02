import Module from 'module'
import pathlib from 'path'

export const requireJsFile = <T>(path: string): T => {
  return require(path)
}

export const requireJsCode = <T>(code: string): T => {
  const filedir = 'tmp'
  const filename = `${Date.now()}.js`

  const fileid = pathlib.join(filedir, filename)

  const m = new Module(fileid)
  m.filename = filename
  // @ts-ignore
  m._compile(code, filename)
  return m.exports
}
