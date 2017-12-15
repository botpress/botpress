import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { cancelNewSkill, insertNewSkill, updateSkill } from '~/actions'

import SkillsBuilder from '../skills'

const mapStateToProps = (state, ownProps) => ({
  installedSkills: state.skills.installed,
  ...state.skills.builder
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      cancelNewSkill,
      insertNewSkill,
      updateSkill
    },
    dispatch
  )

const ConnectedSkillsBuilder = connect(mapStateToProps, mapDispatchToProps)(SkillsBuilder)

export default ConnectedSkillsBuilder
