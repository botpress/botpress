// import axios from 'axios'
// import * as sdk from 'botpress/sdk'
// import crypto from 'crypto'
// import lru from 'lru-cache'
// import Engine from '../../../../src/bp/nlu-core/engine'
// import { bpLogger } from '../../../libraries/src/backend'

// export class BotpressEmbedder {
//   cache_root: string
//   cache: lru<string, Float32Array>
//   model_name: string
//   axiosConfig

//   constructor(public botName, private ghost: sdk.ScopedGhostService) {
//     this.model_name = 'BotpressEmbedder'
//     this.cache_root = './cache/BotpressEmbedder'
//   }

//   async load(axiosConfig) {
//     axiosConfig.timeout = 1000000
//     this.axiosConfig = axiosConfig
//     this.cache = new lru<string, Float32Array>({
//       length: (arr: Float32Array) => {
//         if (arr && arr.BYTES_PER_ELEMENT) {
//           return arr.length * arr.BYTES_PER_ELEMENT
//         } else {
//           return 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT
//         }
//       },
//       max: 300 /* dim */ * Float32Array.BYTES_PER_ELEMENT /* bytes */ * 10000000 /* 10M sentences */
//     })
//     if (await this.ghost.fileExists(this.cache_root, 'embedder_cache.json')) {
//       const stringDump = await this.ghost.readFileAsString(this.cache_root, 'embedder_cache.json')
//       const dump = JSON.parse(stringDump)
//       if (dump) {
//         const kve = dump.map(x => ({ e: x.e, k: x.k, v: Float32Array.from(Object.values(x.v)) }))
//         this.cache.load(kve)
//       }
//     }
//   }

//   async save() {
//     await this.ghost.upsertFile(this.cache_root, 'embedder_cache.json', JSON.stringify(this.cache.dump()))
//   }

//   async embed(sentence: string): Promise<number[]> {
//     this.axiosConfig.timeout = 8000
//     const cache_key = crypto
//       .createHash('md5')
//       .update(sentence)
//       .digest('hex')
//     if (this.cache.has(cache_key)) {
//       return Array.from(this.cache.get(cache_key).values())
//     } else {
//       const utterances = await buildUtteranceBatch([sentence.trim()], 'en', state.Engine.getTools())
//       // const utt_embs = utterances.map(u => u.sentenceEmbedding)
//       // res.send(utt_embs)

//       const { data } = await axios.post(
//         `http://localhost:3000/api/v1/bots/${this.botName}/mod/nlu/embed`,
//         { utterances: [sentence.trim()] },
//         this.axiosConfig
//       )
//       this.cache.set(cache_key, Float32Array.from(data[0]))
//       return data[0]
//     }
//   }
// }

// export class PythonEmbedder {
//   cache_root: string
//   cache: lru<string, Float32Array>
//   model_name: string
//   axiosConfig

//   constructor(private ghost: sdk.ScopedGhostService) {
//     this.model_name = 'PythonEmbedder'
//     this.cache_root = './cache/PythonEmbedder'
//   }

//   async load(axiosConfig) {
//     axiosConfig.timeout = 1000000
//     this.axiosConfig = axiosConfig
//     this.cache = new lru<string, Float32Array>({
//       length: (arr: Float32Array) => {
//         if (arr && arr.BYTES_PER_ELEMENT) {
//           return arr.length * arr.BYTES_PER_ELEMENT
//         } else {
//           return 512 /* dim */ * Float32Array.BYTES_PER_ELEMENT
//         }
//       },
//       max: 512 /* dim */ * Float32Array.BYTES_PER_ELEMENT /* bytes */ * 10000000 /* 10M sentences */
//     })
//     if (await this.ghost.fileExists(this.cache_root, 'embedder_cache.json')) {
//       const stringDump = await this.ghost.readFileAsString(this.cache_root, 'embedder_cache.json')
//       const dump = JSON.parse(stringDump)
//       if (dump) {
//         const kve = dump.map(x => ({ e: x.e, k: x.k, v: Float32Array.from(Object.values(x.v)) }))
//         this.cache.load(kve)
//       }
//     }
//   }

//   async save() {
//     await this.ghost.upsertFile(this.cache_root, 'embedder_cache.json', JSON.stringify(this.cache.dump()))
//   }

//   async embed(sentence: string): Promise<number[]> {
//     const cache_key = crypto
//       .createHash('md5')
//       .update(sentence)
//       .digest('hex')
//     if (this.cache.has(cache_key)) {
//       return Array.from(this.cache.get(cache_key).values())
//     } else {
//       const { data } = await axios.post('http://localhost:8000/embeddings', { documents: [sentence] })
//       const embedding: number[] = data.data[0]
//       this.cache.set(cache_key, Float32Array.from(embedding))
//       return embedding
//     }
//   }
// }
