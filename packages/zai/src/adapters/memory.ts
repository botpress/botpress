import { Adapter } from './adapter'

export class MemoryAdapter extends Adapter {
  public constructor(public examples: any[]) {
    super()
  }

  public async getExamples() {
    return this.examples
  }

  public async saveExample() {}
}
