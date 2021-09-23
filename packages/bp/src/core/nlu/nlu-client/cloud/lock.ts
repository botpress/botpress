import { Lock as LockWithCallback } from 'lock'

type unlockFunc = () => void

export const Locker = () => {
  const lock = LockWithCallback()

  const getLock = async (key: string) =>
    new Promise<unlockFunc>(resolve => {
      lock(key, async unlockFn => {
        const unlock = unlockFn()
        resolve(unlock)
      })
    })

  return getLock
}
