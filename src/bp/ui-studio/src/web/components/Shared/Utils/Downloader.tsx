import axios, { Method } from 'axios'
import React, { FC, useEffect, useRef, useState } from 'react'

import { DownloaderProps } from './typings'

export const Downloader: FC<DownloaderProps> = props => {
  const downloadLink = useRef(null)
  const [content, setContent] = useState<string>()
  const [filename, setFilename] = useState<string>()

  const startDownload = async (url: string, filename?: string, method: Method = 'get') => {
    const { data, headers } = await axios({ method, url, responseType: 'blob' })

    if (!filename) {
      const extractName = /filename=(.*)/.exec(headers['content-disposition'])
      filename = extractName && extractName[1]
    }

    setContent(window.URL.createObjectURL(new Blob([data])))
    setFilename(filename)

    // @ts-ignore
    downloadLink.current!.click()
    props.onDownloadCompleted && props.onDownloadCompleted()
  }

  useEffect(() => {
    if (props.url) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      startDownload(props.url, props.filename)
    }
  }, [props.url])

  return <a ref={downloadLink} href={content} download={filename} />
}
