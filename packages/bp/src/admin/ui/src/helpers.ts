import { Nps } from '~/typings'

const NPS_KEY = 'bp/nps'

export const saveNps = (nps: Nps): void => {
  window.BP_STORAGE.set(NPS_KEY, nps)
}
