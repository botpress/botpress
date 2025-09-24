import { IntegrationLogger, RuntimeError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'

const LOOPS_API_BASE_URL = 'https://app.loops.so/api/v1'

export type TransactionalEmailAttachment = {
  filename: string
  contentType: string
  data: string
}

type SendTransactionalEmailRequest = {
  email: string
  transactionalId: string
  dataVariables?: Record<string, string>
  addToAudience?: boolean
  idempotencyKey?: string
  attachments?: TransactionalEmailAttachment[]
}

type SendTransactionalEmailResponse = {}

export class LoopsApi {
  private _axios: AxiosInstance

  public constructor(
    apiKey: string,
    private _logger: IntegrationLogger
  ) {
    this._axios = axios.create({
      baseURL: LOOPS_API_BASE_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    })
  }

  public async verifyApiKey(): Promise<void> {
    try {
      await this._axios.get('/api-key')
      this._logger.info('API key verified successfully.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new RuntimeError('A network error occurred when trying to validate the API key.')
        }

        if (error.response.status === 401) {
          throw new RuntimeError('Invalid or missing API key.')
        }
      }

      throw new RuntimeError('An unexpected error occurred when trying to validate the API key.')
    }
  }

  public async sendTransactionalEmail(req: SendTransactionalEmailRequest): Promise<SendTransactionalEmailResponse> {
    const { idempotencyKey, ...reqBody } = req

    if (idempotencyKey && idempotencyKey.length > 100) {
      throw new RuntimeError('Idempotency key must be less than 100 characters.')
    }

    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    }

    this._logger.info('These are the headers of the Loops API request:', headers)

    const { attachments, ...rest } = reqBody
    this._logger.info('This is the request body of the Loops API request:', rest)
    this._logger.info('These are the attachments of the Loops API request:', attachments)

    try {
      await this._axios.post('/transactional', reqBody, { headers })

      this._logger.info('Transactional email sent successfully.')
      return {}
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          this._logger.error('A network error occurred when calling the Loops API:', error)
          throw new RuntimeError('A network error occurred when calling the Loops API.')
        }

        this._logger.error('An HTTP error occurred when calling the Loops API:', {
          code: error.response.status,
          ...error.response.data,
        })

        if (error.response.status === 409) {
          throw new RuntimeError('The same idempotency key has already been used in the previous 24 hours.')
        }

        throw new RuntimeError('An HTTP error occurred when calling the Loops API.')
      }

      this._logger.error('An unexpected error occurred when calling the Loops API:', error)
      throw new RuntimeError('An unexpected error occurred when calling the Loops API, see logs for more information.')
    }
  }
}
