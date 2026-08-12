import pathlib from 'path'
import url from 'url'

const _nativePkgJson = url.fileURLToPath(import.meta.resolve('@typescript/native/package.json'))
export const TSC_BIN = pathlib.join(pathlib.dirname(_nativePkgJson), 'bin', 'tsc')
export const ROOT_DIR = pathlib.resolve(pathlib.join(import.meta.dirname, '..'))
export const ZUI_DIST_DIR = pathlib.join(ROOT_DIR, 'dist')
