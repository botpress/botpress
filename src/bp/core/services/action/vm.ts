import { VError } from 'verror'
import { NodeVM, VMScript } from 'vm2'

export class VmRunner {
  /**
   * Execute code in a safe sandboxed environment
   * @param vm - The vm in which to run the code
   * @param code - The code to execute
   * @param identifier - The identifier of the code to run in the vm. i.e: action name, transition name, etc.
   */
  runInVm(vm: NodeVM, code: string, identifier: string) {
    const script = new VMScript(code)

    return new Promise((resolve, reject) => {
      try {
        const retValue = vm.run(script)

        // Check if code returned a Promise-like object
        if (retValue && typeof retValue.then === 'function') {
          retValue.then(resolve, reject)
        } else {
          resolve(retValue)
        }
      } catch (err) {
        const verror = new VError(err, `Could not execute "${identifier}"`)
        reject(verror)
      }
    })
  }
}
