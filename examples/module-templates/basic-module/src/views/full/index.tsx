import { ModuleUI } from 'botpress/shared'
import React from 'react'

const {
  Container,
  InfoTooltip,
  Item,
  ItemList,
  KeyboardShortcut,
  SearchBar,
  SectionAction,
  SidePanel,
  SidePanelSection,
  SplashScreen
} = ModuleUI

// This view is a sample including all the features of Botpress UI
export default class MyMainView extends React.Component {
  state = {
    selectedId: 1,
    loaded: false
  }

  handleItemSelected = (item: Item) => console.info('Selected object:', item)
  handleSearchChanged = value => console.info(value)
  handleSearchClicked = () => console.info('Search clicked')
  handleContextClicked = item => console.info('Item: ', item)
  test = () => console.info('clicked button')

  render() {
    const actions: SectionAction[] = [
      {
        label: 'File',
        icon: 'add', // can also be an icon as jsx element, ex: <MdLibraryAdd />,
        items: [
          { label: 'Open', icon: 'folder-open', onClick: this.test },
          { label: 'New', icon: 'folder-new', onClick: this.test },
          { label: 'Save', icon: 'floppy-disk', onClick: this.test },
          { type: 'divider' },
          { label: 'Delete', icon: 'trash', onClick: this.test }
        ]
      }
    ]

    const items: Item[] = [
      {
        label: 'My element',
        value: { id: 1, something: '/' },
        selected: this.state.selectedId === 1,
        actions: [
          {
            tooltip: 'Create new',
            icon: 'add',
            onClick: this.test
          }
        ],
        contextMenu: [{ label: 'Some action', onClick: () => this.handleContextClicked({ id: 1 }) }]
      },
      {
        label: 'My second element',
        value: { id: 2, name: 'lalal' },
        selected: this.state.selectedId === 2
      }
      // ...
    ]

    return (
      <Container>
        <SidePanel>
          <SearchBar onChange={this.handleSearchChanged} onButtonClick={this.handleSearchClicked} />
          <SidePanelSection label={'My Files'} actions={actions}>
            <ItemList items={items} onElementClicked={this.handleItemSelected} />
            Some other stuff here <InfoTooltip text="Hello! Some info" />
          </SidePanelSection>

          <SidePanelSection label={'Actions'} actions={[{ icon: 'add', tooltip: 'New!', onClick: this.test }]}>
            Some other stuff
          </SidePanelSection>
        </SidePanel>
        {this.state.loaded ? (
          <div>Your module stuff here</div>
        ) : (
          <SplashScreen
            icon="code"
            title={'My Module'}
            description="This module is awesome for creating a basic template"
          >
            <KeyboardShortcut label="Save file" keys={['ACTION', 's']} />
            <KeyboardShortcut label="New file" keys={['ACTION', 'alt', 'n']} />
            Add any other kind of content as child of splash screen
          </SplashScreen>
        )}
      </Container>
    )
  }
}
