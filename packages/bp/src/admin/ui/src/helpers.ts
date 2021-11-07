import { Nps, NpsConfig, NpsTracking } from '~/typings'

const NPS_KEY = 'bp/nps'

export const saveNps = (nps: Nps): void => {
  window.BP_STORAGE.set(NPS_KEY, nps)
}
//
// export const updateNpsTracking = (value: Partial<NpsTracking>): void => {
//   const nps: Nps = window.BP_STORAGE.get(NPS_KEY) || {} as Nps
//
//   if (!nps){
//     return
//   }
//
//   nps.tracking = {
//     ...nps.tracking,
//     ...value
//   }
//
//   window.BP_STORAGE.set(NPS_KEY, nps)
// }
//
// export const updateNpsConfig = (value: Partial<NpsConfig>): void => {
//   const nps: Nps = window.BP_STORAGE.get(NPS_KEY) || {} as Nps
//
//   if (!nps){
//     return
//   }
//
//   nps.config = {
//     ...nps.config,
//     ...value
//   }
//
//   window.BP_STORAGE.set(NPS_KEY, nps)
// }
