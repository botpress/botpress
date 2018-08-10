import { Table } from '../../interfaces'

export default class ModulesTable extends Table {
  name: string = 'srv_modules'

  async bootstrap(): Promise<void> {
    return
  }
}
