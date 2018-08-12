import { VError } from 'verror'
import { NodeVM } from 'vm2'

let isRunning: boolean = false

function returnSuccess(result) {
  process.send && process.send({ success: true, result })
}

function returnError(err) {
  if (typeof err === 'string') {
    err = new Error(err)
  }
  process.send && process.send({ success: false, error: new VError(err, 'Runtime error') })
}

function runCode(code: string, args: any = {}) {
  const vm = new NodeVM({
    sandbox: {},
    compiler: 'javascript',
    wrapper: 'none'
  })

  Object.keys(args).forEach(key => {
    vm.freeze(args[key], key)
  })

  const result = new Promise((resolve, reject) => {
    try {
      const retValue = vm.run(code, '/')

      // Check if code returned a Promise-like object
      if (retValue && typeof retValue.then === 'function') {
        retValue.then(resolve, reject)
      } else {
        resolve(retValue)
      }
    } catch (err) {
      returnError(err)
    }
  })

  result.then(returnSuccess, returnError)
}

process.on('message', message => {
  if (!message || !message.action || isRunning) {
    return
  }

  if (message.action === 'run') {
    isRunning = true
    runCode(message.code, message.args)
  } else {
    returnError(new Error(`Unknown sandbox action "${message.action}"`))
  }
})
