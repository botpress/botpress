import { connect } from 'react-redux'

import { cancelNewSkill, insertNewSkill, updateSkill } from '~/actions'
import SkillsBuilder from '../skills'

const mapStateToProps = state => ({
  installedSkills: state.skills.installed,
  ...state.skills.builder
})

const mapDispatchToProps = {
  cancelNewSkill,
  insertNewSkill,
  updateSkill
}

const ConnectedSkillsBuilder = connect(mapStateToProps, mapDispatchToProps)(SkillsBuilder)

export default ConnectedSkillsBuilder
