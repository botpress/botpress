import watcher from '@parcel/watcher'

export const watch = async (dir: string, fn: watcher.SubscribeCallback, opt?: watcher.Options) => {
  const subscription = await watcher.subscribe(dir, fn, opt)
  return () => subscription.unsubscribe()
}
