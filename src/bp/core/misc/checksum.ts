import crypto from 'crypto'
import fs from 'fs'
import os from 'os'

const CHECKSUM = '//CHECKSUM:'

const calculateHash = content =>
  crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')

/**
 * Checks if there is a checksum on the first line of the file,
 * and uses it to verify if there has been any manual changes in the file's content
 * @param filename
 */
const isOriginalFile = filename => {
  const lines = fs.readFileSync(filename, 'utf-8').split(os.EOL)
  const firstLine = lines[0]

  if (firstLine.indexOf(CHECKSUM) === 0) {
    const fileContent = lines.splice(1, lines.length).join(os.EOL)
    return calculateHash(fileContent) === firstLine.substring(CHECKSUM.length)
  }

  return false
}

/**
 * Calculates the hash for the file's content, then adds a comment on the first line with the result
 * @param filename
 */
const addHashToFile = filename => {
  const fileContent = fs.readFileSync(filename, 'utf-8')
  fs.writeFileSync(filename, `${CHECKSUM}${calculateHash(fileContent)}${os.EOL}${fileContent}`)
}

export { isOriginalFile, addHashToFile }
