import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { useState } from 'react'
import { toastInfo } from '~/utils/toaster'
import { Downloader } from '~/Pages/Components/Downloader'

const DownloadArchive = () => {
  const [downloadUrl, setDownloadUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const downloadArchive = () => {
    setProgress(0)
    setIsLoading(true)
    setDownloadUrl('/admin/versioning/export')
  }

  const downloadCompleted = () => {
    setIsLoading(false)
    toastInfo(lang.tr('admin.versioning.archiveReady'))
  }

  let buttonText = lang.tr('admin.versioning.downloadArchive')

  if (isLoading) {
    if (progress === 0) {
      buttonText = lang.tr('admin.versioning.preparingArchive')
    } else {
      buttonText = lang.tr('admin.versioning.downloadProgress', { progress })
    }
  }

  return (
    <div>
      <Button
        id="btn-downloadArchive"
        icon="download"
        onClick={downloadArchive}
        disabled={isLoading}
        text={buttonText}
      />
      <Downloader
        url={downloadUrl}
        filename={'archive.tgz'}
        onDownloadCompleted={downloadCompleted}
        onProgress={progress => setProgress(progress === 100 ? 0 : progress)}
      />
    </div>
  )
}

export default DownloadArchive
