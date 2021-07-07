import { AxiosRequestConfig, AxiosStatic } from 'axios'

const MODULE_URL_PREFIX = '/qna'

class QnAApiClient {
  constructor(private axios: AxiosStatic) {}

  async get(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.get(MODULE_URL_PREFIX + url, config)
    return res.data
  }

  getQuestion(id) {
    return this.get(`/questions/${id}`)
  }

  async getQuestions({
    page,
    pageSize,
    question,
    categories
  }: {
    page: number
    pageSize: number
    question?: string
    categories?: { label: string; value: string }[]
  }) {
    const params = {
      limit: pageSize,
      offset: page * pageSize,
      question: question || undefined,
      categories: categories && categories.length ? categories : undefined
    }

    const data = await this.get('/questions', { params })

    return {
      ...data,
      // TODO: this shouldn't be needed but the API is returning more results than requested
      // when offset === 0
      items: data.items.slice(0, pageSize)
    }
  }

  async getCategories() {
    const { data } = await this.axios.get('/nlu/contexts')
    return data
  }
}

export default QnAApiClient
