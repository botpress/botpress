export type ActionMetadata = {
  cost: number
}

export class ActionMetadataStore {
  private _cost: number = 0

  public get cost(): number {
    return this._cost
  }

  public setCost(cost: number): void {
    this._cost = cost
  }

  public toJSON(): ActionMetadata {
    return {
      cost: this.cost,
    }
  }
}
