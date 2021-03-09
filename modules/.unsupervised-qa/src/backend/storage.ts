import * as sdk from 'botpress/sdk'

const DIRECTORY = 'unsupervised'
const FILE_NAME = 'corpus.txt'

export class Storage {
  private cache: string | undefined

  constructor(private ghost: sdk.ScopedGhostService) {}

  public persistCorpus(corpus: string) {
    this.cache = undefined
    return this.ghost.upsertFile(DIRECTORY, FILE_NAME, corpus)
  }

  public async getCorpus() {
    if (this.cache) {
      return this.cache
    }

    let corpus: string
    try {
      corpus = await this.ghost.readFileAsString(DIRECTORY, FILE_NAME)
    } catch (err) {
      return ''
    }

    this.cache = corpus
    return this.cache
  }
}
