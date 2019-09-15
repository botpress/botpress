import { NodeVM, VMScript } from 'vm2'

export class VmRunner {
  runInVm(vm: NodeVM, code: string, path?: string) {
    const script = new VMScript(code)

    return new Promise((resolve, reject) => {
      try {
        const retValue = vm.run(script, path)

        // Check if code returned a Promise-like object
        if (retValue && typeof retValue.then === 'function') {
          retValue.then(resolve, reject)
        } else {
          resolve(retValue)
        }
      } catch (err) {
        reject(err)
      }
    })
  }
}
