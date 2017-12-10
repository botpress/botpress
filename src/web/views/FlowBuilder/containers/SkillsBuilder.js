//insertNewSkill

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { cancelNewSkill } from '~/actions'
import { getCurrentSkill } from '~/reducers'

import _ from 'lodash'

import SkillsBuilder from '../skills'

const mapStateToProps = (state, ownProps) => ({
  installedSkills: state.skills.installed,
  ...state.skills.builder
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      cancelNewSkill
    },
    dispatch
  )

const ConnectedSkillsBuilder = connect(mapStateToProps, mapDispatchToProps)(SkillsBuilder)

export default ConnectedSkillsBuilder
