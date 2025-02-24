import { mkdir, writeFile } from 'fs/promises'
import { parse } from 'path'

export const createFile = async (path: string, content: string) => {
  const file = parse(path)
  await mkdir(file.dir, { recursive: true })
  await writeFile(path, content)
}
