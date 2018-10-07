import * as sdk from 'botpress/sdk'
export type Extension = {
  nlu: any
  qna: {
    /**
     * Parses and imports questions; consecutive questions with similar answer get merged
     * @param {String|Array.<{question: String, action: String, answer: String}>} questions
     * @param {Object} options
     * @param {String} [options.format] - format of "questions" string ('csv' or 'json')
     * @returns {Promise} Promise object represents an array of ids of imported questions
     */
    import: Function

    /**
     * @async
     * Fetches questions and represents them as json
     * @param {Object} options
     * @param {Boolean} [options.flat = false] - whether multiple questions get split into separate records
     * @returns {Array.<{questions: Array, question: String, action: String, answer: String}>}
     */
    export: Function

    /**
     * @async
     * Returns question by id
     * @param {String} id - id of the question to look for
     * @returns {Object}
     */
    getQuestion: Function

    /**
     * @async
     * Returns array of matchings questions-answers along with their confidence level
     * @param {String} question - question to match against
     * @returns {Array.<{questions: Array, answer: String, id: String, confidence: Number, metadata: Array}>}
     */
    answersOn: Function
  }
}

export type SDK = typeof sdk & Extension

export interface QnaStorage {
  initialize()
  all(opts?: Pagination)
  insert(qna: any)
  update(data: any, id: any)
  delete(id: any): void
  count(): any
  answersOn(question)
  getQuestion(opts: any)
}

export interface Pagination {
  offset: number
  limit: number
}
