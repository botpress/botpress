import { Button, Card, ControlGroup, InputGroup, MenuItem, Popover, PopoverInteractionKind, PopoverPosition } from "@blueprintjs/core"
import { MultiSelect } from '@blueprintjs/select'
import { AxiosStatic } from "axios"
import { ElementPreview } from "botpress/utils"
import classnames from "classnames"
import React from "react"

import style from './style.scss'
import ApiClient from "./NLUApiClient"
import Pager from "./Pager"

const ITEMS_PER_PAGE = 2

interface Props {
  axios: AxiosStatic
  language: string
  selected: string
  params: string | object | null
  onSelect: (id: string | null, params?: string | object | null) => void
}

interface State {
}

class IntentPicker extends React.Component<Props, State> {
  state = {}

  apiClient = new ApiClient(this.props.axios)

  render() {
    return null
  }
}

export default IntentPicker
