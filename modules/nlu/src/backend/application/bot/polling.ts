export type PollCommand = 'keep-polling' | 'stop-polling'
export type PollCb = () => Promise<'keep-polling' | 'stop-polling'>

export const poll = (cb: PollCb, ms: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const int = setInterval(async () => {
      try {
        const status = await cb()
        if (status === 'stop-polling') {
          clearInterval(int)
          resolve()
        }
      } catch (err) {
        clearInterval(int)
        reject(err)
      }
    }, ms)
  })
}
