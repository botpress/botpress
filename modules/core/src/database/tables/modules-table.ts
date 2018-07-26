import { Table } from '../interfaces'

export default class ModulesTable extends Table {
  name: string = 'srv_modules'

  bootstrap(): Promise<void> {
    return
  }
}
