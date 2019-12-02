import { injectable } from 'inversify'

@injectable()
export class StatsService {
  constructor() {}

  public start() {
    console.log('Stats Service Started!')

    setInterval(this.run, 1000)
  }

  private run() {
    console.log('running')
  }
}
