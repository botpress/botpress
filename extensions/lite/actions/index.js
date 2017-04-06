import reactor from '~/reactor'

import { RULES_RECEIVED } from '~/actions/actionTypes'

const fetchRules = () => {
	reactor.dispatch(RULES_RECEIVED, { rules: null })
}

module.exports = {
	fetchRules
}