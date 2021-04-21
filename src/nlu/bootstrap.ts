import 'bluebird-global'
// eslint-disable-next-line import/order
import './rewire'
import _ from 'lodash'
import STAN from './stan'

void STAN({
  host: '0.0.0.0',
  port: 3200,
  limitWindow: '1s',
  limit: 10000,
  bodySize: '500mb',
  batchSize: 16,
  silent: false,
  modelCacheSize: '1000mb',
  languageURL: 'https://lang-01.botpress.io/',
  ducklingURL: 'http://localhost:8000',
  ducklingEnabled: false
})
