import { Snippet } from './indexer'

export class DocumentClassifier {
  async train(snippets: Snippet[]) {}
  async predict(text: string): Promise<Snippet> {
    // TODO
    return { name: '', content: '', page: '', paragraph: '', source: 'doc' }
  }
}
