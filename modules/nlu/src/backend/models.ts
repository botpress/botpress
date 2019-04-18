import fs from 'fs'
import _ from 'lodash'
import path from 'path'

export type LanguageEmbeddingFile = { path: string; lang: string }

export function getPretrained(): LanguageEmbeddingFile[] {
  const modelPath = path.join(process.APP_DATA_PATH, 'embeddings')
  if (!fs.existsSync(modelPath)) {
    return []
  }

  const files = fs.readdirSync(modelPath)
  return files
    .map(f => {
      // Examples:  "scope.en.300.bin" "bp.fr.150.bin"
      const regex = /(\w+)\.(\w+)\.(\d+)\.bin/i
      const match = f.match(regex)
      if (!match) {
        return
      }

      return <LanguageEmbeddingFile>{
        lang: match[2],
        path: path.join(modelPath, f)
      }
    })
    .filter(Boolean)
}
