import { DocumentClassifier } from './classifier'
import { Indexer } from './indexer'

export type IndexerByBot = { [botId: string]: Indexer }
export type ClassifierByBot = { [botId: string]: DocumentClassifier }
