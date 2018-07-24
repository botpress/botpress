import axios from 'axios'

export class ModuleLoader {
  async loadModule(module: any): Promise<any> {
    return axios
      .get(module.url + '/register')
      .then(() => console.log(module.name + ' is loaded'))
      .catch(error => console.error('Could not load module: ' + module.name + ' - ' + error))
  }
}
