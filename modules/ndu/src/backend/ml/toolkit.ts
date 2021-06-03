import _ from 'lodash'

import { Predictor, Trainer as SVMTrainer } from './svm'
import { MLToolkit as IMLToolkit } from './typings'

const MLToolkit: typeof IMLToolkit = {
  SVM: {
    Predictor,
    Trainer: SVMTrainer
  }
}

export default MLToolkit
