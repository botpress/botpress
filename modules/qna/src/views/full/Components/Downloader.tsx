import axios, { Method } from 'axios'
import React, { FC, useEffect, useRef, useState } from 'react'

// Copied as-is from the studio
export interface DownloaderProps {
  /** When the URL is set, the backend is called and the download is started. */
  url: string
  /** If the filename is not set, it will be extracted from headers */
  filename?: string
  /** Trigger an action after the download is done */
  onDownloadCompleted?: () => void
}

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
