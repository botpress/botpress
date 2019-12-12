import { Method } from 'axios'
import ms from 'ms'
import React, { FC, useEffect, useRef, useState } from 'react'
import api from '~/api'

interface DownloadProps {
  url?: string
  filename: string
  onDownloadCompleted?: () => void
}

export const Downloader: FC<DownloadProps> = props => {
  const downloadLink = useRef(null)
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')

  const startDownload = async (url: string, filename: string, method: Method = 'get') => {
    const { data } = await api.getSecured({ timeout: ms('10m') })({
      method,
      url,
      responseType: 'blob'
    })

    setContent(window.URL.createObjectURL(new Blob([data])))
    setFilename(filename)

    // @ts-ignore
    downloadLink.current!.click()
    props.onDownloadCompleted && props.onDownloadCompleted()
  }

  useEffect(() => {
    if (props.url && props.filename) {
      // tslint:disable-next-line: no-floating-promises
      startDownload(props.url, props.filename)
    }
  }, [props.url])

  return <a ref={downloadLink} href={content} download={filename} />
}
