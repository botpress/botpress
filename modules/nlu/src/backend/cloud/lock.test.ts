import { Locker } from './lock'

describe('getLock', () => {
  it('should never release a lock', async () => {
    const fn = jest.fn()

    const lock = Locker()
    lock('key')
    lock('key').then(() => {
      fn()
    })

    await new Promise(r => setTimeout(r, 100))

    expect(fn).not.toHaveBeenCalled()
  })

  it('should wait for lock before updating value', async done => {
    const lock = Locker()

    let value = ''

    lock('key').then(unlock =>
      setTimeout(() => {
        value = 'unexpected'
        unlock()
      }, 100)
    )

    expect(value).toEqual('')

    await lock('key')

    expect(value).toEqual('unexpected')
    value = 'expected'
    expect(value).toEqual('expected')

    setTimeout(() => {
      expect(value).toEqual('expected')
      done!()
    }, 200)
  })
})
