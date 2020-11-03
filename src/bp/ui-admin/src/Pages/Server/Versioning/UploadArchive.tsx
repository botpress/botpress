import { Button, Classes, Dialog, FileInput, FormGroup, H4, Intent, Switch, TextArea } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import ms from 'ms'
import React, { Fragment, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

const _uploadArchive = async (fileContent: any, doUpdate: boolean) => {
  const { data } = await api
    .getSecured({ timeout: ms('10m') })
    .post(`/admin/versioning/${doUpdate ? 'update' : 'changes'}`, fileContent, {
      headers: { 'Content-Type': 'application/tar+gzip' }
    })
  return data
}

const checkForChanges = (fileContent: any) => _uploadArchive(fileContent, false)
const sendArchive = (fileContent: any) => _uploadArchive(fileContent, true)

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

  const uploadArchive = async () => {
    setIsLoading(true)
    try {
      if (useForce) {
        await sendArchive(fileContent)
        closeDialog()
        toastSuccess(lang.tr('admin.versioning.changesPushed'))
        return
      }

      const blockingChanges = processChanges(await checkForChanges(fileContent)).blockingChanges
      if (blockingChanges.length) {
        setChanges(blockingChanges.map(prettyLine).join('\n'))
        return
      }

      await sendArchive(fileContent)
      closeDialog()
      toastSuccess(lang.tr('admin.versioning.changesPushed'))
    } catch (err) {
      toastFailure(err)
    } finally {
      setIsLoading(false)
    }
  }

  const readArchive = (files: FileList | null) => {
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

  const closeDialog = () => {
    setFilePath('')
    setFileContent('')
    setChanges('')
    setDialogOpen(false)
  }

  const renderUpload = () => {
    return (
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readArchive(e.dataTransfer.files)
        }}
      >
        <Fragment>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={<span>{lang.tr('admin.versioning.serverArchive')}</span>}
              labelFor="input-archive"
              helperText={<span>{lang.tr('admin.versioning.selectArchivedExported')}</span>}
            >
              <FileInput
                text={filePath || lang.tr('chooseFile')}
                onChange={e => readArchive((e.target as HTMLInputElement).files)}
                inputProps={{ accept: '.tgz' }}
                fill={true}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-push"
                text={isLoading ? lang.tr('admin.versioning.pleaseWait') : lang.tr('admin.versioning.pushChanges')}
                disabled={!filePath || !fileContent || isLoading}
                onClick={uploadArchive}
                intent={Intent.PRIMARY}
                style={{ height: 20, marginLeft: 5 }}
              />
            </div>
          </div>
        </Fragment>
      </div>
    )
  }

  const renderConflict = () => {
    return (
      <Fragment>
        <div className={Classes.DIALOG_BODY}>
          <div>
            <H4>{lang.tr('admin.versioning.conflictWarning')}</H4>
            <p>{lang.tr('admin.versioning.conflictMessage')}</p>
            <TextArea value={changes} rows={22} cols={120} />
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Switch
                id="chk-useForce"
                checked={useForce}
                onChange={() => setUseForce(!useForce)}
                label={lang.tr('admin.versioning.forcePush')}
                style={{ margin: '3px 20px 0 20px' }}
              />
              <Button
                id="btn-upload"
                text={isLoading ? lang.tr('admin.versioning.pleaseWait') : lang.tr('upload')}
                disabled={!useForce || isLoading}
                onClick={uploadArchive}
                intent={Intent.PRIMARY}
                style={{ height: 20, marginLeft: 5 }}
              />
            </div>
          </div>
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Button
        icon="upload"
        id="btn-uploadArchive"
        text={lang.tr('admin.versioning.uploadArchive')}
        onClick={() => setDialogOpen(true)}
      />

      <Dialog
        title={lang.tr('admin.versioning.uploadArchive')}
        icon="import"
        isOpen={isDialogOpen}
        onClose={closeDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
        style={{ width: changes ? 800 : 500 }}
      >
        {!changes ? renderUpload() : renderConflict()}
      </Dialog>
    </Fragment>
  )
}
export default UploadArchive
