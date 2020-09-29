import _ from 'lodash'
import seedrandom from 'seedrandom'

import { SeededLodashProvider as ISeededLodashProvider } from '../typings'

const MAX_SEED = 100000

export default class SeededLodashProvider implements ISeededLodashProvider {
  private _seed: number = SeededLodashProvider._randomInt()

  public setSeed(seed: number) {
    this._seed = seed
  }

  public getSeededLodash() {
    seedrandom(`${this._seed}`, { global: true })
    return _.runInContext()
  }

  public resetSeed() {
    this._seed = SeededLodashProvider._randomInt()
    seedrandom(`${this._seed}`, { global: true })
  }

  private static _randomInt() {
    return Math.round(new Date().getMilliseconds() % MAX_SEED)
  }
}
