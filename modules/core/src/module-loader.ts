import axios from 'axios'

export class ModuleLoader {
  loadModule(url: string): Promise<any> {
    return axios.get(url + '/register')
  }
}
