const vanillaPayload = {
  type: 'nlu',
  name: 'training',
  working: true,
  message: 'Model is training'
}

export const getPayloadForInnerSVMProgress = total => offset => index => value => ({
  value: 0.25 + Math.floor((value * (index + offset)) / (2 * total))
})

export const identityProgress = (value: number) => ({ value })

export const getProgressPayload = (progressFn: Function) => (progress: number) => ({
  ...vanillaPayload,
  ...progressFn(progress)
})

export const crfPayloadProgress = progress => ({
  value: 0.75 + Math.floor(progress / 4)
})

export const notifyProgress = (realtime, realtimePayload) => progressFn => progress =>
  realtime.sendPayload(realtimePayload.forAdmins('statusbar.event', getProgressPayload(progressFn)(progress)))
