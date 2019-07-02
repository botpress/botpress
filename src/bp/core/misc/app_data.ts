import path from 'path'

export function getAppDataPath() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA!, 'botpress')
  } else if (process.platform === 'darwin') {
    return path.join(process.env.HOME!, 'Library', 'Application Support', 'botpress')
  }

  // unix
  return path.join(process.env.HOME!, 'botpress')
}
