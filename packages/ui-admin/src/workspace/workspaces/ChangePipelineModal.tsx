import { Button, Checkbox, Classes, Dialog, Radio, RadioGroup } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import { defaultPipelines } from 'common/defaults'
import { Workspace } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'

interface Props {
  workspace: Workspace
  isOpen: boolean
  toggle: () => void
  refreshWorkspaces: () => void
}

const ChangePipelineModal: FC<Props> = props => {
  const [pipelineId, setPipelineId] = useState('none')
  const [custom, setCustom] = useState<string[]>()
  const [resetStage, setResetStage] = useState(false)

  useEffect(() => {
    loadPipeline()
  }, [props.workspace, props.isOpen])

  const loadPipeline = () => {
    if (!props.workspace || !props.workspace.pipeline) {
      return
    }
    const { pipeline } = props.workspace

    let found = false
    Object.keys(defaultPipelines).forEach(pipelineId => {
      if (_.isEqual(pipeline, defaultPipelines[pipelineId])) {
        setPipelineId(pipelineId)
        setCustom(undefined)
        found = true
      }
    })

    if (!found) {
      setPipelineId('custom')
      setCustom(pipeline.map(x => x.id))
    }
  }

  const submit = async () => {
    try {
      await api
        .getSecured()
        .post(`/admin/workspace/workspaces/${props.workspace.id}/pipeline`, { pipelineId, resetStage })

      toast.success('Pipeline updated successfully')
      props.toggle()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  return (
    <Dialog
      isOpen={props.isOpen}
      icon="git-branch"
      onClose={props.toggle}
      transitionDuration={0}
      title="Configure Pipeline"
    >
      <div className={Classes.DIALOG_BODY}>
        <RadioGroup
          label="Which pipeline would you like to use?"
          onChange={e => setPipelineId(e.currentTarget.value)}
          selectedValue={pipelineId}
        >
          <Radio id="radio-no-pipeline" label="No pipeline [production]" value="none" />
          <Radio id="radio-bp-pipeline" label="Botpress default [dev, staging, production]" value="botpress" />
          {custom && <Radio id="radio-bp-custom" label={`Custom  [${custom.join(', ')}]`} value="custom" />}
        </RadioGroup>
        <br />
        <Checkbox
          checked={resetStage}
          onChange={e => setResetStage(e.currentTarget.checked)}
          label="Move all bots to the first stage of the pipeline"
        />
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button id="btn-submit-change-pipeline" text="Submit" onClick={submit} />
        </div>
      </div>
    </Dialog>
  )
}

export default ChangePipelineModal
