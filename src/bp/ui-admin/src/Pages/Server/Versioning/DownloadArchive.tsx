import { Button } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useState } from 'react'
import { toastInfo } from '~/utils/toaster'
import { Downloader } from '~/Pages/Components/Downloader'

const DownloadArchive = () => {
  const [downloadUrl, setDownloadUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const downloadArchive = () => {
    setIsLoading(true)
    setDownloadUrl('/admin/versioning/export')
  }

  const downloadCompleted = () => {
    setIsLoading(false)
    toastInfo('Archive ready')
  }

  return (
    <div>
      <Button
        id="btn-downloadArchive"
        icon="download"
        onClick={downloadArchive}
        disabled={isLoading}
        text={isLoading ? 'Please wait...' : 'Download archive'}
      />
      <Downloader url={downloadUrl} filename={'archive.tgz'} onDownloadCompleted={downloadCompleted} />
    </div>
  )
}

export default DownloadArchive
