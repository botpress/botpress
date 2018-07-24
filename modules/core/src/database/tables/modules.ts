import { Table } from '../interfaces'

export default class ModulesTable extends Table {
  Name: string = 'srv_modules'

  bootstrap(): Promise<void> {
    return
  }

}