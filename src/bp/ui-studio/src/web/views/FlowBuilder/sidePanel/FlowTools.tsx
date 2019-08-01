import { Icon } from '@blueprintjs/core'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { buildNewSkill } from '~/actions'
import PermissionsChecker from '~/components/Layout/PermissionsChecker'

import style from './style.scss'

interface ToolItemProps {
  type: string
  id?: string
  icon?: any
  label: string
}

interface SkillDefinition {
  id: string
  name: string
  moduleName: string
}

const FlowTools: FC<{ skills: SkillDefinition[]; user: any }> = props => {
  return (
    <div className={style.toolPanel}>
      <ToolItem label="Node" type="node" id="standard" icon="chat" />
      <PermissionsChecker user={props.user} op="write" res="bot.skills">
        <div className={style.title}>Skills</div>
        <div className={style.section}>
          {props.skills &&
            props.skills.map(skill => <ToolItem key={skill.id} label={skill.name} type="skill" id={skill.id} />)}
        </div>
      </PermissionsChecker>
    </div>
  )
}

const ToolItem: FC<ToolItemProps> = ({ label, type, id, icon }) => {
  return (
    <div className={style.toolItem} key={id}>
      <div
        className={style.icon}
        draggable={true}
        onDragStart={event => {
          event.dataTransfer.setData('diagram-node', JSON.stringify({ type, id }))
        }}
      >
        <Icon icon={icon || 'add'} iconSize={22} />
      </div>
      <div className={style.title}>{label}</div>
    </div>
  )
}

const mapStateToProps = state => ({
  skills: state.skills.installed,
  user: state.user
})

const mapDispatchToProps = {
  buildSkill: buildNewSkill
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowTools)
