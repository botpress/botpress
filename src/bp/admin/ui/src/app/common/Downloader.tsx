import { Method } from 'axios'
import ms from 'ms'
import React, { FC, useEffect, useRef, useState } from 'react'
import api from '~/app/api'

interface DownloadProps {
  url?: string
  filename: string
  onDownloadCompleted?: () => void
  onProgress?: (pct: number) => void
}

export const Downloader: FC<DownloadProps> = props => {
  const downloadLink = useRef(null)
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')

  const startDownload = async (url: string, filename: string, method: Method = 'get') => {
    const { data } = await api.getSecured({ timeout: ms('20m') })({
      method,
      url,
      responseType: 'blob',
      onDownloadProgress: evt => {
        if (props.onProgress) {
          props.onProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      }
    })

    setContent(window.URL.createObjectURL(new Blob([data])))
    setFilename(filename)

    // @ts-ignore
    downloadLink.current!.click()
    props.onDownloadCompleted && props.onDownloadCompleted()
  }

  useEffect(() => {
    if (props.url && props.filename) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      startDownload(props.url, props.filename)
    }
  }, [props.url])

  return <a ref={downloadLink} href={content} download={filename} />
}
