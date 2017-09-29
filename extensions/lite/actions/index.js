import reactor from '~/reactor'

import actionTypes from '~/actions/actionTypes'

const {
	RULES_RECEIVED
} = actionTypes

const fetchRules = () => {
  reactor.dispatch(RULES_RECEIVED, { rules: null })
}

module.exports = {
  fetchRules
}
