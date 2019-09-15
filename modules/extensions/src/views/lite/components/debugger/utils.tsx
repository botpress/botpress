export const formatConfidence = confidence => (+confidence * 100).toFixed(1)

const SETTINGS_KEY = 'bp::modules::extensions::settings'
const DEFAULT_SETTINGS: Settings = {
  autoOpenDebugger: true,
  updateToLastMessage: true
}

export const loadSettings = (): Settings => {
  try {
    const settings = window['BP_STORAGE'].get(SETTINGS_KEY)
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS
  } catch (err) {
    console.log('Error loading settings', err)
    return DEFAULT_SETTINGS
  }
}

export const persistSettings = (settings: Settings) => {
  window['BP_STORAGE'].set(SETTINGS_KEY, JSON.stringify(settings))
}

interface Settings {
  autoOpenDebugger: boolean
  updateToLastMessage: boolean
}
