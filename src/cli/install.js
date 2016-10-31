import { spawn } from 'child_process'
import util from '../util'

const waitingText = 'please wait, we are trying to install your new module...'

module.exports = function(argument) {
  if(argument && typeof(argument) === 'string'){
    util.print(waitingText);
    
    const install = spawn('npm', ['install', '--save', argument])

    install.stdout.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    install.stderr.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    install.on('close', (code) => {
      if(code > 0) {
        util.print('error', "an error occured during module's installation")
      } else {
        util.print('success', "module's installation has completed successfully")
      }
    })
  }else{
    util.print('error', 'module name or path is not valid')
  }
}
