import { Icon } from '@blueprintjs/core'
import { MainLayout, lang, ModuleUI } from 'botpress/shared'
import { ALL_BOTS } from 'common/utils'
import _ from 'lodash'
import { inject, observer } from 'mobx-react'
import React from 'react'

import { FileType } from '../../backend/typings'
import { HOOK_SIGNATURES } from '../../typings/hooks'

import FileStatus from './components/FileStatus'
import NameModal from './components/NameModal'
import NewFileModal from './components/NewFileModal'
import { UploadModal } from './components/UploadModal'
import FileNavigator from './FileNavigator'
import { RootStore, StoreDef } from './store'
import { EditorStore } from './store/editor'
import { EXAMPLE_FOLDER_LABEL } from './utils/tree'

const { SearchBar, SidePanel, SidePanelSection } = ModuleUI

class PanelContent extends React.Component<Props> {
  private expandedNodes = {}

  state = {
    actionFiles: [],
    hookFiles: [],
    botConfigs: [],
    moduleConfigFiles: [],
    rawFiles: [],
    sharedLibs: [],
    selectedNode: '',
    selectedFile: undefined,
    isMoveModalOpen: false,
    isCreateModalOpen: false,
    isUploadModalOpen: false,
    fileType: undefined,
    hookType: undefined
  }

  componentDidMount() {
    this.updateFolders()
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.files !== this.props.files) {
      this.updateFolders()
    }
  }

  addFiles(fileType: string, label: string, fileList: any[]) {
    const files = this.props.files[fileType]

    if (files && files.length) {
      const sortedFiles = _.sortBy(files, 'location')
      fileList.push({ label, files: sortedFiles })
    }
  }

  updateFolders() {
    if (!this.props.files) {
      return
    }

    const rawFiles = []
    this.addFiles('raw', 'Data', rawFiles)

    const actionFiles = []
    this.addFiles('bot.actions', lang.tr('module.code-editor.sidePanel.bot', { name: window['BOT_NAME'] }), actionFiles)
    this.addFiles('global.actions', lang.tr('module.code-editor.sidePanel.global'), actionFiles)

    const hookFiles = []
    this.addFiles('bot.hooks', lang.tr('module.code-editor.sidePanel.bot', { name: window['BOT_NAME'] }), hookFiles)
    this.addFiles('global.hooks', lang.tr('module.code-editor.sidePanel.global'), hookFiles)

    const botConfigFiles = []
    this.addFiles('bot.bot_config', lang.tr('module.code-editor.sidePanel.currentBot'), botConfigFiles)
    this.addFiles('global.main_config', lang.tr('module.code-editor.sidePanel.global'), botConfigFiles)

    const moduleConfigFiles = []
    this.addFiles('bot.module_config', lang.tr('module.code-editor.sidePanel.currentBot'), moduleConfigFiles)
    this.addFiles('global.module_config', lang.tr('module.code-editor.sidePanel.global'), moduleConfigFiles)

    const sharedLibs = []
    this.addFiles('bot.shared_libs', lang.tr('module.code-editor.sidePanel.currentBot'), sharedLibs)
    this.addFiles('global.shared_libs', lang.tr('module.code-editor.sidePanel.global'), sharedLibs)

    this.addFiles('hook_example', EXAMPLE_FOLDER_LABEL, hookFiles)
    this.addFiles('action_example', EXAMPLE_FOLDER_LABEL, actionFiles)

    this.setState({ actionFiles, hookFiles, botConfigs: botConfigFiles, moduleConfigFiles, rawFiles, sharedLibs })
  }

  updateNodeExpanded = (id: string, isExpanded: boolean) => {
    if (isExpanded) {
      this.expandedNodes[id] = true
    } else {
      delete this.expandedNodes[id]
    }
  }

  updateNodeSelected = (fullyQualifiedId: string) => {
    this.setState({ selectedNode: fullyQualifiedId })
  }

  hasPermission = (perm: string, isWrite?: boolean): boolean => {
    const { permissions } = this.props
    return permissions && permissions[perm] && permissions[perm][isWrite ? 'write' : 'read']
  }

  createFilePrompt(type: FileType, hookType?: string) {
    this.setState({ fileType: type, hookType, isCreateModalOpen: true })
  }

  showAddButtons(type: string): boolean {
    const isGlobalApp = window.BOT_ID === ALL_BOTS
    const canWriteGlobal = this.hasPermission(`global.${type}`, true)

    return !isGlobalApp || (isGlobalApp && canWriteGlobal)
  }

  renderSectionModuleConfig() {
    if (!this.hasPermission('global.module_config') && !this.hasPermission('bot.module_config')) {
      return null
    }

    return (
      <SidePanelSection label={lang.tr('module.code-editor.sidePanel.moduleConf')}>
        <FileNavigator
          id="moduleConfig"
          files={this.state.moduleConfigFiles}
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          contextMenuType="moduleConfig"
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
        />
      </SidePanelSection>
    )
  }

  renderSectionConfig() {
    if (!this.hasPermission('global.main_config') && !this.hasPermission('bot.bot_config')) {
      return null
    }

    return (
      <SidePanelSection label={lang.tr('module.code-editor.sidePanel.conf')}>
        <FileNavigator
          id="config"
          files={this.state.botConfigs}
          disableContextMenu
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
        />
      </SidePanelSection>
    )
  }

  renderSectionActions() {
    let actions: any = [
      {
        id: 'btn-add-action',
        icon: <Icon icon="add" />,
        key: 'add',
        onClick: () => this.createFilePrompt('action_legacy')
      }
    ]
    if (window.EXPERIMENTAL) {
      actions = [
        {
          id: 'btn-add-action',
          icon: <Icon icon="add" />,
          key: 'add',
          items: [
            { label: 'Action (HTTP)', onClick: () => this.createFilePrompt('action_http') },
            { label: 'Action (Legacy)', onClick: () => this.createFilePrompt('action_legacy') }
          ]
        }
      ]
    }

    if (!this.showAddButtons('actions')) {
      actions = []
    }

    return (
      <SidePanelSection label={lang.tr('module.code-editor.sidePanel.actions')} actions={actions}>
        <FileNavigator
          id="actions"
          files={this.state.actionFiles}
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
        />
      </SidePanelSection>
    )
  }

  renderSharedLibs() {
    if (!this.hasPermission('bot.shared_libs')) {
      return null
    }

    const actions = [
      {
        id: 'btn-add-action',
        icon: <Icon icon="add" />,
        key: 'add',
        onClick: () => this.createFilePrompt('shared_libs')
      }
    ]

    return (
      <SidePanelSection label={lang.tr('module.code-editor.sidePanel.sharedLibs')} actions={actions}>
        <FileNavigator
          id="shared_libs"
          files={this.state.sharedLibs}
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
        />
      </SidePanelSection>
    )
  }

  renderSectionHooks() {
    if (!this.hasPermission('global.hooks') && !this.hasPermission('bot.hooks')) {
      return null
    }

    return (
      <SidePanelSection
        label={lang.tr('module.code-editor.sidePanel.hooks')}
        actions={this._buildHooksActions(this.hasPermission('global.hooks', true))}
      >
        <FileNavigator
          id="hooks"
          files={this.state.hookFiles}
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
        />
      </SidePanelSection>
    )
  }

  renderSectionRaw() {
    const createFile = async (name: string) => {
      return this.props.editor.openFile({ name, location: name, content: ' ', type: 'raw' })
    }

    return (
      <SidePanelSection
        label={lang.tr('module.code-editor.sidePanel.rawFileEditor')}
        actions={[
          {
            id: 'btn-upload-sidepanel',
            icon: <Icon icon="upload" />,
            key: 'upload',
            onClick: () => this.setState({ selectedFile: undefined, isUploadModalOpen: true })
          },
          {
            id: 'btn-add-action',
            icon: <Icon icon="add" />,
            key: 'add',
            onClick: () => this.setState({ selectedFile: undefined, isMoveModalOpen: true })
          }
        ]}
      >
        <FileNavigator
          id="raw"
          files={this.state.rawFiles}
          expandedNodes={this.expandedNodes}
          selectedNode={this.state.selectedNode}
          onNodeStateExpanded={this.updateNodeExpanded}
          onNodeStateSelected={this.updateNodeSelected}
          moveFile={file => this.setState({ selectedFile: file, isMoveModalOpen: true })}
        />
        <NameModal
          isOpen={this.state.isMoveModalOpen}
          toggle={() => this.setState({ isMoveModalOpen: !this.state.isMoveModalOpen })}
          createFile={createFile}
          renameFile={this.props.store.renameFile}
          selectedFile={this.state.selectedFile}
          files={this.props.files}
        />
      </SidePanelSection>
    )
  }

  _buildHooksActions(showGlobalHooks: boolean) {
    if (!this.showAddButtons('hooks')) {
      return []
    }

    const hooks = Object.keys(HOOK_SIGNATURES).map(hookType => ({
      id: hookType,
      label: hookType
        .split('_')
        .map(x => x.charAt(0).toUpperCase() + x.slice(1))
        .join(' '),
      onClick: () => this.createFilePrompt('hook', hookType)
    }))

    const items = [
      {
        label: lang.tr('module.code-editor.sidePanel.eventHooks'),
        items: hooks.filter(x =>
          [
            'before_incoming_middleware',
            'after_incoming_middleware',
            'before_outgoing_middleware',
            'after_event_processed',
            'before_suggestions_election',
            'before_session_timeout',
            'before_conversation_end'
          ].includes(x.id)
        )
      },
      {
        label: lang.tr('module.code-editor.sidePanel.botHooks'),
        items: hooks.filter(x =>
          ['after_bot_mount', 'after_bot_unmount', 'before_bot_import', 'on_bot_error'].includes(x.id)
        )
      }
    ]

    if (showGlobalHooks) {
      items.push(
        {
          label: lang.tr('module.code-editor.sidePanel.generalHooks'),
          items: hooks.filter(x => ['after_server_start', 'on_incident_status_changed'].includes(x.id))
        },
        {
          label: lang.tr('module.code-editor.sidePanel.pipelineHooks'),
          items: hooks.filter(x => ['on_stage_request', 'after_stage_changed'].includes(x.id))
        }
      )
    }

    return [
      {
        id: 'btn-add-hook',
        icon: <Icon icon="add" />,
        key: 'add',
        items
      }
    ]
  }

  render() {
    const { isAdvanced } = this.props.editor
    return (
      <SidePanel>
        <React.Fragment>
          <SearchBar
            icon="filter"
            placeholder={lang.tr('module.code-editor.sidePanel.filterFiles')}
            onChange={this.props.setFilenameFilter}
          />
          {isAdvanced ? (
            this.renderSectionRaw()
          ) : (
            <React.Fragment>
              {this.renderSectionActions()}
              {this.renderSectionHooks()}
              {this.renderSharedLibs()}
              {this.renderSectionConfig()}
              {this.renderSectionModuleConfig()}
            </React.Fragment>
          )}
        </React.Fragment>

        <MainLayout.BottomPanel.Register tabName="Code Editor">
          <FileStatus />
        </MainLayout.BottomPanel.Register>

        <NewFileModal
          isOpen={this.state.isCreateModalOpen}
          toggle={() => this.setState({ isCreateModalOpen: !this.state.isCreateModalOpen })}
          openFile={this.props.editor.openFile}
          selectedType={this.state.fileType}
          selectedHookType={this.state.hookType}
          hasPermission={this.hasPermission}
          files={this.props.files}
        />
        <UploadModal
          isOpen={this.state.isUploadModalOpen}
          uploadFile={this.props.store.uploadFile}
          toggle={() => this.setState({ isUploadModalOpen: !this.state.isUploadModalOpen })}
          files={this.props.files}
        />
      </SidePanel>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  editor: store.editor,
  files: store.files,
  setFilenameFilter: store.setFilenameFilter,
  createFilePrompt: store.createFilePrompt,
  permissions: store.permissions
}))(observer(PanelContent))

type Props = { store?: RootStore; editor?: EditorStore; uploadFile?: any } & Pick<
  StoreDef,
  'files' | 'permissions' | 'createFilePrompt' | 'setFilenameFilter'
>
