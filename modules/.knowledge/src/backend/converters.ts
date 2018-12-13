import { execFileSync } from 'child_process'
import { readFileSync } from 'fs'
import os from 'os'
import path from 'path'

export interface Converter {
  (fullPath: string): Promise<string>
  fileExtensions: string[]
}

async function pdf(fullPath: string): Promise<string> {
  const binExt = { darwin: 'osx', linux: 'linux', win32: 'win.exe' }[os.platform()]
  const args = ['-enc', 'UTF-8', fullPath, '-']

  return execFileSync(path.resolve(__dirname, './tools/bin/pdftotext_' + binExt), args, {
    encoding: 'utf8'
  })
}
pdf.fileExtensions = ['.pdf']
export const Pdf: Converter = pdf

async function text(fullPath): Promise<string> {
  return readFileSync(fullPath, 'utf8')
}
text.fileExtensions = ['.txt', '.text', '.rtf']
export const Text: Converter = text
