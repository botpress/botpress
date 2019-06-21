const vanillaPayload = {
  type: 'nlu',
  name: 'training',
  working: true,
  message: 'Model is training'
}

export const identityProgress = (value: number) => ({ value })

export const getProgressPayload = (progressFn: Function) => (progress: number) => ({
  ...vanillaPayload,
  ...progressFn(progress)
})
