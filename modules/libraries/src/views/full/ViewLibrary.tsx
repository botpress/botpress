import { Button } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { InstalledLibrary } from 'full'
import React, { FC, useRef, useState } from 'react'

import style from './style.scss'
import TaskResult from './TaskResult'

interface Props {
  lib: InstalledLibrary
  axios: any
  refreshLibraries: () => void
}

const sanitizeName = (text: string) =>
  text
    .replace(/\s|\t|\n/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '')

const ViewLibrary: FC<Props> = props => {
  const downloadLink = useRef(null)
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const packageDeps = async () => {
    setLoading(true)

    try {
      const { name, version } = props.lib

      const { data } = await props.axios.post('/mod/libraries/package', { name, version }, { responseType: 'blob' })

      setContent(window.URL.createObjectURL(new Blob([data])))
      setFilename(sanitizeName(`${name}-${version}.tgz`))

      downloadLink.current!.click()
    } finally {
      setLoading(false)
    }
  }

  const deleteLibrary = async () => {
    if (!(await confirmDialog('Are you sure ?', {}))) {
      return
    }

    setLoading(true)
    try {
      const { name } = props.lib

      const { data } = await props.axios.post('/mod/libraries/delete', { name })
      setResult(data)
      props.refreshLibraries()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className={style.title}>
        {props.lib.name} <small>({props.lib.version})</small>
      </div>
      <h5>Package with dependencies</h5>
      This will package the library, including all of its dependencies, in a single .tgz file which can be imported in
      another installation (one which lacks access to internet, for example)
      <br />
      <Button onClick={packageDeps} disabled={loading} text={loading ? 'Please wait...' : 'Package & Download'} />
      <a ref={downloadLink} href={content} download={filename} />
      <br />
      <br />
      <h5>Delete library</h5>
      This will delete the library and all of its dependencies. If the archive exists on the BPFS, it will also be
      removed.
      <br />
      <Button onClick={deleteLibrary} disabled={loading} text={loading ? 'Please wait...' : 'Delete'} />
      <TaskResult message={result} />
    </div>
  )
}

export default ViewLibrary
