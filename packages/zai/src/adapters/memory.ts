import { Adapter } from './adapter'

export class MemoryAdapter extends Adapter {
  constructor(public examples: any[]) {
    super()
  }

  async getExamples() {
    return this.examples
  }

  async saveExample() {}
}
