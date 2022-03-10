import {
  Button,
  Checkbox,
  Classes,
  Dialog,
  FileInput,
  FormGroup,
  H4,
  Intent,
  Switch,
  TextArea
} from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import { bytesToString } from 'common/utils'
import _ from 'lodash'
import ms from 'ms'
import React, { Fragment, useState } from 'react'
import api from '~/app/api'

const _uploadArchive = async (fileContent: any, doUpdate: boolean, progressCb: (pct: number) => void) => {
  const { data } = await api
    .getSecured({ timeout: ms('20m') })
    .post(`/admin/management/versioning/${doUpdate ? 'update' : 'changes'}`, fileContent, {
      headers: { 'Content-Type': 'application/tar+gzip' },
      onUploadProgress: evt => progressCb(Math.round((evt.loaded / evt.total) * 100))
    })
  return data
}

const checkForChanges = (fileContent: any, progressCb) => _uploadArchive(fileContent, false, progressCb)
const sendArchive = (fileContent: any, progressCb) => _uploadArchive(fileContent, true, progressCb)

const processChanges = (data: any[]): any => {
  const changeList = _.flatten(data.map(x => x.changes))
  return {
    localFiles: _.flatten(data.map(x => x.localFiles)),
    blockingChanges: changeList.filter(x => ['del', 'edit'].includes(x.action)),
    changeList
  }
}

const prettyLine = ({ action, path, add, del, sizeDiff }): string => {
  if (action === 'add') {
    return ` + ${path}`
  } else if (action === 'del') {
    return ` - ${path}`
  } else if (action === 'edit') {
    if (sizeDiff) {
      return ` o ${path} (difference: ${bytesToString(sizeDiff)})`
    }
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
  const [progress, setProgress] = useState(0)

  const uploadArchive = async () => {
    setIsLoading(true)
    try {
      if (useForce) {
        await sendArchive(fileContent, setProgress)
        closeDialog()
        toast.success(lang.tr('admin.versioning.changesPushed'))
        return
      }

      const blockingChanges = processChanges(await checkForChanges(fileContent, setProgress)).blockingChanges
      if (blockingChanges.length) {
        setChanges(blockingChanges.map(prettyLine).join('\n'))
        return
      }

      await sendArchive(fileContent, setProgress)
      closeDialog()
      toast.success(lang.tr('admin.versioning.changesPushed'))
    } catch (err) {
      toast.failure(err)
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
    let buttonText = lang.tr('admin.versioning.pushChanges')

    if (isLoading) {
      if (progress === 0) {
        buttonText = lang.tr('admin.versioning.pleaseWait')
      } else if (progress > 0 && progress < 100) {
        buttonText = lang.tr('admin.versioning.uploadProgress', { progress })
      } else if (progress === 100) {
        buttonText = lang.tr('admin.versioning.processing')
      }
    }

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

            <FormGroup helperText={<span>{lang.tr('admin.versioning.forcePushInfo')}</span>}>
              <Checkbox
                id="chk-useForce"
                checked={useForce}
                onChange={() => setUseForce(!useForce)}
                label={lang.tr('admin.versioning.forcePush')}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-push"
                text={buttonText}
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
                id="btn-upload-archive"
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
