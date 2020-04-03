import { IconName } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { ItemList, SidePanel, SidePanelSection } from '~/components/Shared/Interface'

export default class SidebarView extends Component<Props> {
  CATEGORY_ALL = {
    id: 'all',
    title: lang.tr('all'),
    count: null
  }

  render() {
    const contentTypeActions = this.props.categories.map(cat => {
      return {
        id: `btn-create-${cat.id}`,
        label: lang.tr(cat.title),
        onClick: () => {
          this.props.handleCategorySelected(cat.id)
          this.props.handleAdd()
        }
      }
    })

    const actions = [
      {
        tooltip: lang.tr('studio.content.sideBar.createNewContent'),
        id: 'btn-add-content',
        icon: 'add' as IconName,
        items: [contentTypeActions]
      }
    ]

    const contentTypes = [this.CATEGORY_ALL, ...this.props.categories].map(cat => {
      return {
        id: `btn-filter-${cat.id}`,
        label: !!cat.count ? `${lang.tr(cat.title)} (${cat.count})` : lang.tr(cat.title),
        value: cat,
        selected: cat.id === this.props.selectedId,
        actions: [
          cat !== this.CATEGORY_ALL && {
            id: `btn-list-create-${cat.id}`,
            tooltip: lang.tr('studio.content.sideBar.createNew', { name: lang.tr(cat.title) }),
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
        <SidePanelSection label={lang.tr('studio.content.sideBar.filterByType')} actions={actions}>
          <ItemList items={contentTypes} onElementClicked={el => this.props.handleCategorySelected(el.value.id)} />
        </SidePanelSection>
      </SidePanel>
    )
  }
}

interface Props {
  categories: any
  handleCategorySelected: (id: string) => void
  selectedId: string
  readOnly: boolean
  handleAdd: any
}
