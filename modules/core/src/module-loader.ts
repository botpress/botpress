import axios from 'axios'
import { injectable, tagged, inject } from 'inversify'
import ms from 'ms'

import { Throttle } from 'lodash-decorators'
import { ModuleMetadata } from 'botpress-module-sdk'
import { TYPES } from './misc/types'
import { Logger } from './misc/interfaces'

@injectable()
export class ModuleLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    public logger: Logger
  ) {}

  private async loadConfiguration() {}

  private async refreshAvailableModules() {}

  @Throttle(ms('5m'))
  async getAvailableModules() {
    this.logger.debug('Fetching modules')

    // fs.readFile(path.join(this.configLocation, MODULES_CONFIG_PATH), 'utf8', (error, data) => {
    //   if (!data || error) {
    //     console.error('Could not read from Botpress configuration files')
    //     return
    //   }

    //   this.modulesConfig = JSON.parse(data)
    //   this.modulesConfig.modules.forEach((module: any) => this.moduleLoader.loadModule(module))
    // })
  }

  async loadModule(module: any): Promise<any> {
    try {
      const { data } = await axios.get(`${module.url}/register`)
      const metadata = <ModuleMetadata>data
      console.log(metadata)
    } catch (err) {}

    return axios
      .get(module.url + '/register')
      .then(() => console.log(module.name + ' is loaded'))
      .catch(error => console.error('Could not load module: ' + module.name + ' - ' + error))
  }
}
