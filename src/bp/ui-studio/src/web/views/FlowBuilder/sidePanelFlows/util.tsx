import { Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import find from 'lodash/find'
import React from 'react'
import { getFlowLabel, reorderFlows } from '~/components/Shared/Utils'

import { ERROR_FLOW_ICON, FLOW_ICON, FOLDER_ICON, MAIN_FLOW_ICON, TIMEOUT_ICON } from './FlowsList'

/**
 * Returns a different display for special flows.
 * @param flowId The full path of the flow (including folders)
 * @param flowName The display name of the flow (only filename)
 */
const getFlowInfo = (flowId: string, flowName: string) => {
  if (flowId === 'main') {
    return {
      icon: MAIN_FLOW_ICON,
      label: (
        <Tooltip
          content={<span>{lang.tr('studio.flow.sessionStartsHere')}</span>}
          hoverOpenDelay={500}
          position={Position.BOTTOM}
        >
          <strong>{getFlowLabel(flowName)}</strong>
        </Tooltip>
      )
    }
  } else if (flowId === 'error') {
    return {
      icon: ERROR_FLOW_ICON,
      label: (
        <Tooltip
          content={<span>{lang.tr('studio.flow.whenErrorEncountered')}</span>}
          hoverOpenDelay={500}
          position={Position.BOTTOM}
        >
          <strong>{getFlowLabel(flowName)}</strong>
        </Tooltip>
      )
    }
  } else if (flowId === 'timeout') {
    return {
      icon: TIMEOUT_ICON,
      label: (
        <Tooltip
          content={<span>{lang.tr('studio.flow.whenDiscussionTimeouts')}</span>}
          hoverOpenDelay={500}
          position={Position.BOTTOM}
        >
          <strong>{getFlowLabel(flowName)}</strong>
        </Tooltip>
      )
    }
  }
  return {
    icon: FLOW_ICON,
    label: flowName
  }
}

const addNode = (tree, folders, flowDesc, data) => {
  for (const folderDesc of folders) {
    let folder = find(tree.childNodes, folderDesc)
    if (!folder) {
      folder = { ...folderDesc, parent: tree, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }
  tree.childNodes.push({ ...flowDesc, parent: tree, ...data })
}

const compareNodes = (a, b) => {
  if (a.type === b.type) {
    return a.name < b.name ? -1 : 1
  }
  return a.type === 'folder' ? -1 : 1
}

const sortChildren = tree => {
  if (!tree.childNodes) {
    return
  }
  tree.childNodes.sort(compareNodes)
  tree.childNodes.forEach(sortChildren)
}

export const getUniqueId = node => `${node.type}:${node.fullPath}`

export const splitFlowPath = flow => {
  const flowPath = flow.replace(/\.flow\.json$/, '').split('/')
  const flowName = flowPath[flowPath.length - 1]
  const flowFolders = flowPath.slice(0, flowPath.length - 1)
  const folders = []
  const currentPath = []

  for (const folder of flowFolders) {
    currentPath.push(folder)
    folders.push({ id: folder, type: 'folder', icon: FOLDER_ICON, label: folder, fullPath: currentPath.join('/') })
  }

  currentPath.push(flowName)
  const id = currentPath.join('/')
  const { icon, label } = getFlowInfo(id, flowName)
  return {
    folders,
    flow: {
      id,
      icon,
      label,
      fullPath: id,
      type: 'flow'
    }
  }
}

export const buildFlowsTree = (flows, filterName) => {
  const tree = { icon: 'root', fullPath: '', label: '<root>', childNodes: [] }
  flows.forEach(flowData => {
    const { folders, flow } = splitFlowPath(flowData.name)
    if (!filterName || flow.id.includes(filterName)) {
      addNode(tree, folders, flow, { nodeData: flowData })
    }
  })

  sortChildren(tree)

  return reorderFlows(tree.childNodes)
}
