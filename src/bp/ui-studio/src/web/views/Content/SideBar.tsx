import { IconName } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Component } from 'react'
import { ItemList, SidePanel, SidePanelSection } from '~/components/Shared/Interface'

const CATEGORY_ALL = {
  id: 'all',
  title: 'All',
  count: null
}

export default class SidebarView extends Component<Props> {
  render() {
    const contentTypeActions = this.props.categories.map(cat => {
      return {
        label: cat.title,
        onClick: () => {
          this.props.handleCategorySelected(cat.id)
          this.props.handleAdd()
        }
      }
    })

    const actions = [{ tooltip: 'Create new content', icon: 'add' as IconName, items: [contentTypeActions] }]

    const contentTypes = [CATEGORY_ALL, ...this.props.categories].map(cat => {
      return {
        label: !!cat.count ? `${cat.title} (${cat.count})` : cat.title,
        value: cat,
        selected: cat.id === this.props.selectedId,
        actions: [
          cat !== CATEGORY_ALL && {
            tooltip: 'Create new ' + cat.title,
            icon: 'add' as IconName,
            onClick: () => {
              this.props.handleCategorySelected(cat.id)
              this.props.handleAdd()
            }
          }
        ]
      }
    })

    return (
      <SidePanel>
        <SidePanelSection label="Filter by Content Type" actions={actions}>
          <ItemList items={contentTypes} onElementClicked={el => this.props.handleCategorySelected(el.value.id)} />
        </SidePanelSection>
      </SidePanel>
    )
  }
}

interface Props {
  categories: any
  handleCategorySelected: any
  selectedId: any
  readOnly: boolean
  handleAdd: any
}
