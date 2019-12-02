import { injectable } from 'inversify'

@injectable()
export class StatsService {
  constructor() {}

  public start() {
    console.log('Stats Service Started!')
  }
}
