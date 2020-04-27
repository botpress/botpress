import { Icon, IconName } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { buildNewSkill } from '~/actions'
import { AccessControl } from '~/components/Shared/Utils'

import style from './style.scss'

interface ToolItemProps {
  type: string
  id?: string
  icon?: any
  label: string
}

export interface SkillDefinition {
  id: string
  name: string
  icon: IconName
  moduleName: string
}

const FlowTools: FC<{ skills: SkillDefinition[] }> = props => {
  if (window.EXPERIMENTAL) {
    return (
      <div className={style.toolPanel}>
        <ToolItem label={lang.tr('studio.flow.sidePanel.node')} type="node" id="standard" icon="chat" />
        <ToolItem label={lang.tr('say')} type="node" id="say_something" icon="comment" />
        <ToolItem label={lang.tr('execute')} type="node" id="execute" icon="code-block" />
        <ToolItem label={lang.tr('listen')} type="node" id="listen" icon="hand" />
        <ToolItem label={lang.tr('router')} type="node" id="router" icon="search-around" />
        <ToolItem label={lang.tr('action')} type="node" id="action" icon="offline" />
        <AccessControl resource="bot.skills" operation="write">
          <div className={style.title}>{lang.tr('skills')}</div>
          <div className={style.section}>
            {props.skills &&
              props.skills.map(skill => <ToolItem key={skill.id} label={skill.name} type="skill" id={skill.id} />)}
          </div>
        </AccessControl>
        <div className={style.title}>{lang.tr('chips')}</div>
        <ToolItem label="Transition" type="chip" id="transition" icon="flow-end" />
      </div>
    )
  } else {
    return (
      <div className={style.toolPanel}>
        <ToolItem label="Node" type="node" id="standard" icon="chat" />
        <AccessControl resource="bot.skills" operation="write">
          <div className={style.title}>{lang.tr('skills')}</div>
          <div className={style.section}>
            {props.skills?.map(skill => (
              <ToolItem key={skill.id} label={lang.tr(skill.name)} type="skill" id={skill.id} icon={skill.icon} />
            ))}
          </div>
        </AccessControl>
      </div>
    )
  }
}

const ToolItem: FC<ToolItemProps> = ({ label, type, id, icon }) => {
  return (
    <div
      id={`btn-tool-${id}`}
      className={style.toolItem}
      key={id}
      draggable
      onDragStart={event => {
        event.dataTransfer.setData('diagram-node', JSON.stringify({ type, id }))
      }}
    >
      <div className={style.icon}>
        <Icon icon={icon || 'add'} iconSize={22} />
      </div>
      <div className={style.title}>{label}</div>
    </div>
  )
}

const mapStateToProps = state => ({
  skills: state.skills.installed
})

const mapDispatchToProps = {
  buildSkill: buildNewSkill
}

export default connect(mapStateToProps, mapDispatchToProps)(FlowTools)
