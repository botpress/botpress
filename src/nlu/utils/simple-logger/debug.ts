import Logger from './index'
import { LogLevel } from './enums'

class DebugLogger implements IDebugInstance {
  constructor(public enabled: boolean) {
  }
  forBot(botId: string, message: string, extra?: any): void {
    
  }
  sub(namespace: string): IDebugInstance {
    throw new Error('Method not implemented.')
  }
  
}


const DEBUG: IDebug = (module: string, botId?: string) => new Logger(module)

export default DEBUG
