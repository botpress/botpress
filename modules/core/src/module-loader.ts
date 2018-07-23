import axios from 'axios'

export class ModuleLoader {
  loadModule(module: any): Promise<any> {
    return axios
      .get(module.url + '/register')
      .then(() => console.log(module.name + ' is loaded'))
      .catch(error => console.log(error.response))
  }
}
