import { Button, MenuItem } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
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
        <MenuItem id="btn-export" icon="upload" text={lang.tr('module.qna.exportToJson')} onClick={startDownload} />
      ) : (
        <Button
          id="btn-export"
          icon="upload"
          text={lang.tr('module.qna.exportToJson')}
          onClick={startDownload}
          style={{ marginLeft: 5 }}
        />
      )}

      <Downloader url={url} />
    </Fragment>
  )
}
