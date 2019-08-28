import { Button, Classes, ControlGroup, Dialog, FileInput, Intent, Switch, TextArea } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

const sendArchive = async (fileContent: any, doUpdate: boolean) => {
  const { data } = await api
    .getSecured({ timeout: 30000 })
    .post(`/admin/versioning/${doUpdate ? 'update' : 'changes'}`, fileContent, {
      headers: { 'Content-Type': 'application/tar+gzip' }
    })
  return data
}

const processChanges = (data: any[]): any => {
  const changeList = _.flatten(data.map(x => x.changes))
  return {
    localFiles: _.flatten(data.map(x => x.localFiles)),
    blockingChanges: changeList.filter(x => ['del', 'edit'].includes(x.action)),
    changeList
  }
}

const prettyLine = ({ action, path, add, del }): string => {
  if (action === 'add') {
    return ` + ${path}`
  } else if (action === 'del') {
    return ` - ${path}`
  } else if (action === 'edit') {
    return ` o ${path} (+${add} / -${del})`
  }
  return ''
}

const UploadArchive = () => {
  const [filePath, setFilePath] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useForce, setUseForce] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [changes, setChanges] = useState('')
  const [isAvailable, setAvailable] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    bpfsStatus()
  }, [])

  const bpfsStatus = async () => {
    const { data } = await api.getSecured().get('/admin/versioning/bpfsStatus')
    setAvailable(data.isAvailable)
  }

  const uploadArchive = async () => {
    setIsLoading(true)
    try {
      if (useForce) {
        await sendArchive(fileContent, true)
        toastSuccess(`Changes pushed successfully!`)
        return
      }

      const blockingChanges = processChanges(await sendArchive(fileContent, false)).blockingChanges
      if (blockingChanges.length) {
        setChanges(blockingChanges.map(prettyLine).join('\n'))
        setDialogOpen(true)
        return
      }

      await sendArchive(fileContent, true)
      toastSuccess(`Changes pushed successfully!`)
    } catch (err) {
      toastFailure(err)
    } finally {
      setIsLoading(false)
    }
  }

  const readArchive = event => {
    const files = (event.target as HTMLInputElement).files
    if (!files) {
      return
    }

    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      setFileContent(_.get(loadedEvent, 'target.result'))
    }
    setFilePath(files[0].name)
  }

  if (!isAvailable) {
    return <div>Archive upload disabled. BPFS Storage "Database" is required</div>
  }

  return (
    <React.Fragment>
      <ControlGroup fill={false} vertical={false}>
        <FileInput text={filePath || 'Choose file...'} onChange={readArchive} />
        <Switch
          checked={useForce}
          onClick={() => setUseForce(!useForce)}
          label="Force push my changes"
          style={{ margin: '3px 20px 0 20px' }}
        />
        <Button
          text={isLoading ? 'Please wait...' : 'Upload archive'}
          disabled={!filePath || !fileContent}
          onClick={uploadArchive}
          style={{ height: 20, marginLeft: 5 }}
        />
      </ControlGroup>
      {useForce && (
        <span>
          * Please make sure you have{' '}
          <a href="https://botpress.io/docs/next/advanced/versions/" target="_blank">
            <b>read the documentation</b>
          </a>{' '}
          before forcing your changes!
        </span>
      )}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        transitionDuration={0}
        style={{ width: 800 }}
        title={<b>Conflict warning</b>}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>
            Remote has changes that are not synced to your environment. Backup your changes and use "pull" to get those
            changes on your file system. If you still want to overwrite remote changes, close this dialog and turn on
            the switch "Force push my changes"
          </p>

          <TextArea value={changes} rows={22} cols={120} />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button text="Close" intent={Intent.DANGER} onClick={() => setDialogOpen(false)} />
          </div>
        </div>
      </Dialog>
    </React.Fragment>
  )
}
export default UploadArchive
