import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { backOff } from 'exponential-backoff'
import { z } from 'zod'
import * as bp from '.botpress'

const accessTokenResponseSchema = z.object({
  access_token: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

const recordingFileSchema = z.object({
  file_type: z.string(),
  file_extension: z.string(),
  download_url: z.string().optional(),
})

const recordingsResponseSchema = z.object({
  recording_files: z.array(recordingFileSchema).optional(),
})

export class ZoomClient {
  private config: Pick<bp.configuration.Configuration, 'zoomClientId' | 'zoomClientSecret' | 'zoomAccountId'>
  private logger: bp.Logger

  constructor(
    config: Pick<bp.configuration.Configuration, 'zoomClientId' | 'zoomClientSecret' | 'zoomAccountId'>,
    logger: bp.Logger
  ) {
    this.config = config
    this.logger = logger
  }

  async getAccessToken(): Promise<string> {
    const { zoomClientId, zoomClientSecret, zoomAccountId } = this.config
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`
    const authHeader = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString('base64')

    try {
      const { data } = await axios.post(tokenUrl, null, {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      })

      const validation = accessTokenResponseSchema.safeParse(data)
      if (!validation.success || !validation.data.access_token) {
        throw new RuntimeError('Invalid access token response')
      }

      return validation.data.access_token
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const validation = accessTokenResponseSchema.safeParse(error.response.data)
        const errorData = validation.success ? validation.data : {}
        const errorMsg = `Zoom access token fetch failed (HTTP ${error.response.status}): ${errorData.error_description || errorData.error || 'Unknown error'}`
        this.logger.forBot().error(errorMsg, errorData)
        throw new RuntimeError(errorMsg)
      }
      this.logger.forBot().error('Failed to fetch Zoom access token', error)
      throw new RuntimeError('Failed to fetch Zoom access token')
    }
  }

  /**
   * Fetch transcript file URL with retries
   * Zoom may take time to generate the transcript, so we retry up to 3 times
   *
   * API: GET /meetings/{meetingId}/recordings
   * Docs: https://developers.zoom.us/docs/api/meetings/#tag/cloud-recording
   */
  async fetchTranscriptUrl(
    meetingUUID: string,
    accessToken: string
  ): Promise<{ transcriptUrl: string; audioUrl: string } | null> {
    const encodedUUID = encodeURIComponent(meetingUUID)

    try {
      return await backOff(
        async () => {
          const { data } = await axios.get(`https://api.zoom.us/v2/meetings/${encodedUUID}/recordings`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 15000,
          })

          const validation = recordingsResponseSchema.safeParse(data)
          if (!validation.success) {
            this.logger.forBot().error('Invalid recordings response format')
            throw new RuntimeError('Invalid recordings response format')
          }

          const transcriptFile = validation.data.recording_files?.find(
            (f) => f.file_type === 'TRANSCRIPT' && f.file_extension === 'VTT'
          )

          if (!transcriptFile?.download_url) {
            throw new Error('Transcript not ready')
          }

          const audioFile = validation.data.recording_files?.find((f) => f.file_type === 'M4A')

          if (!audioFile?.download_url) {
            throw new Error('Audio not ready')
          }

          return { transcriptUrl: transcriptFile.download_url, audioUrl: audioFile.download_url }
        },
        { numOfAttempts: 3, startingDelay: 20000 }
      )
    } catch (error) {
      // Return null if transcript or audio wasn't found after retries
      if (error instanceof Error && (error.message === 'Transcript not ready' || error.message === 'Audio not ready')) {
        this.logger
          .forBot()
          .warn(`Recording files not found for meeting ${meetingUUID} after retries: ${error.message}`)
        return null
      }

      // Re-throw other errors (network failures, auth errors, etc.)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        this.logger.forBot().error(`Failed to fetch recordings for meeting ${meetingUUID}: HTTP ${status}`, error)
        throw new RuntimeError(`Failed to fetch recordings: HTTP ${status || 'network error'}`)
      }

      throw error
    }
  }
}
