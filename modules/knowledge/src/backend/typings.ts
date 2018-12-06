import { DocumentClassifier } from './classifier'
import { Indexer, Snippet } from './indexer'

export type IndexerByBot = { [botId: string]: Indexer }
export type ClassifierByBot = { [botId: string]: DocumentClassifier }
