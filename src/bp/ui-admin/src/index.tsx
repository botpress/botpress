import * as BlueprintJsCore from '@blueprintjs/core'
import * as BlueprintJsSelect from '@blueprintjs/select'
import 'babel-polyfill'
import 'element-closest-polyfill'
import 'ui-shared/dist/theme.css'

import './index.css'

window['BlueprintJsCore'] = BlueprintJsCore
window['BlueprintJsSelect'] = BlueprintJsSelect

// Anything requiring ui-shared must be added in the main file (so blueprint is correctly loaded)
require('./main')
