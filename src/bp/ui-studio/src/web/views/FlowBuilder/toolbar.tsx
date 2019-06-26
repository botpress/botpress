import {
  AnchorButton,
  Button,
  Divider,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Position,
  Tooltip
} from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'
import PermissionsChecker from '~/components/Layout/PermissionsChecker'
import { LeftToolbarButtons, Toolbar } from '~/components/Shared/Interface'

const SkillDropdown = props => {
  return (
    <PermissionsChecker user={props.user} op="write" res="bot.skills">
      <Popover position={Position.BOTTOM} minimal={true}>
        <Button rightIcon="caret-down" text="Insert skill" />
        <Menu>
          <MenuDivider title="Installed skills" />
          {!props.skills.length && <MenuDivider title="No skills installed" />}
          {props.skills.map((skill, i) => (
            <MenuItem key={i} onClick={() => props.buildSkill(skill.id)} text={skill.name} />
          ))}
        </Menu>
      </Popover>
    </PermissionsChecker>
  )
}

const FlowToolbar = props => {
  const canMakeStartNode = () => {
    const current = props.currentFlow && props.currentFlow.startNode
    const potential = props.currentFlowNode && props.currentFlowNode.name
    return current && potential && current !== potential
  }

  const toggleInsertMode = action => () => {
    props.setDiagramAction(props.currentDiagramAction === action ? null : action)
  }

  const setAsCurrentNode = () => props.updateFlow({ startNode: props.currentFlowNode.name })

  const hasUnsavedChanges = !_.isEmpty(props.dirtyFlows)
  const isInsertNodeMode = props.currentDiagramAction === 'insert_node'

  const isStartNode = props.currentFlowNode && props.currentFlowNode.name === props.currentFlow.startNode
  const canCopy = !!props.currentFlowNode

  return (
    <Toolbar>
      <LeftToolbarButtons>
        <Tooltip content="Save all (ctrl+s)" position={Position.BOTTOM}>
          <AnchorButton
            icon="floppy-disk"
            disabled={window.BOTPRESS_FLOW_EDITOR_DISABLED || !hasUnsavedChanges}
            onClick={() => props.onSaveAllFlows && props.onSaveAllFlows()}
          />
        </Tooltip>

        <Divider />

        <Tooltip content="Undo" position={Position.BOTTOM}>
          <AnchorButton icon="undo" disabled={!props.canUndo} onClick={props.undo} />
        </Tooltip>

        <Tooltip content="Redo" position={Position.BOTTOM}>
          <AnchorButton icon="redo" disabled={!props.canRedo} onClick={props.redo} />
        </Tooltip>

        <Divider />

        <Tooltip content="Copy" position={Position.BOTTOM}>
          <AnchorButton icon="duplicate" disabled={!canCopy} onClick={props.onCopy} />
        </Tooltip>

        <Tooltip content="Paste" position={Position.BOTTOM}>
          <AnchorButton icon="clipboard" disabled={!props.canPasteNode} onClick={props.onPaste} />
        </Tooltip>

        <Divider />

        <Tooltip content="Insert New Node (ctrl+a)" position={Position.BOTTOM}>
          <AnchorButton icon="insert" active={isInsertNodeMode} onClick={toggleInsertMode('insert_node')} />
        </Tooltip>

        <SkillDropdown {...props} />

        <Divider />

        <Tooltip content="Set as Start node" position={Position.BOTTOM}>
          <AnchorButton icon="star" disabled={!canMakeStartNode()} onClick={setAsCurrentNode} />
        </Tooltip>

        <Tooltip content="Delete" position={Position.BOTTOM}>
          <AnchorButton icon="trash" disabled={isStartNode} onClick={props.onDelete} />
        </Tooltip>
      </LeftToolbarButtons>
    </Toolbar>
  )
}

export default FlowToolbar
