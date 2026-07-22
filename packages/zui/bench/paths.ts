import pathlib from 'path'
import url from 'url'

export const TSC_BIN = url.fileURLToPath(import.meta.resolve('typescript/bin/tsc'))
export const ROOT_DIR = pathlib.resolve(pathlib.join(import.meta.dirname, '..'))
export const ZUI_DIST_DIR = pathlib.join(ROOT_DIR, 'dist')
