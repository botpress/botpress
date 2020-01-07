import { Button, MenuItem } from '@blueprintjs/core'
import { Downloader } from 'botpress/utils'
import React, { FC, Fragment, useState } from 'react'

interface Props {
  category?: string
  asMenu?: boolean
}

export const ExportButton: FC<Props> = props => {
  const [url, setUrl] = useState('')

  const startDownload = () => {
    setUrl(`${window.BOT_API_PATH}/mod/qna/export${props.category ? '/' + props.category : ''}`)
  }

  return (
    <Fragment>
      {props.asMenu ? (
        <MenuItem id="btn-export" icon="upload" text="Export to JSON" onClick={startDownload} />
      ) : (
        <Button id="btn-export" icon="upload" text="Export to JSON" onClick={startDownload} style={{ marginLeft: 5 }} />
      )}

      <Downloader url={url} />
    </Fragment>
  )
}
