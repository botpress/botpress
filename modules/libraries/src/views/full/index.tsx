import { Container, ItemList, SidePanel, SidePanelSection, SplashScreen } from 'botpress/ui'
import React, { useEffect, useState } from 'react'

import style from './style.scss'
import AddLibrary from './AddLibrary'
import UploadLibrary from './UploadLibrary'
import ViewLibrary from './ViewLibrary'

export interface InstalledLibrary {
  name: string
  version: string
}

const MainView = props => {
  const [libraries, setLibraries] = useState([])
  const [page, setPage] = useState('splash')
  const [lib, setLib] = useState<InstalledLibrary>()

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    refreshLibraries()
  }, [])

  const refreshLibraries = async () => {
    const { data } = await props.bp.axios.get('/mod/libraries/list')

    setLibraries(
      Object.entries(data).map(([name, version]) => ({
        label: (
          <span>
            <strong>{name}</strong> <small>{version}</small>
          </span>
        ),
        data: { name, version },
        value: name
      }))
    )
  }

  const handleLibClicked = item => {
    setPage('view')
    setLib(item.data)
  }

  const commonProps = { refreshLibraries, setPage }

  return (
    <Container>
      <SidePanel>
        <SidePanelSection
          label="Libraries"
          actions={[{ icon: 'add', tooltip: 'Add Library', onClick: () => setPage('add') }]}
        >
          <ItemList items={libraries} onElementClicked={handleLibClicked} />
        </SidePanelSection>
      </SidePanel>
      <div>
        {page === 'splash' && (
          <SplashScreen
            icon="book"
            title="Shared Libraries"
            description={
              <div>
                These libraries can be used by every bots, actions and hooks. You can also create custom pieces of code
                which can be imported by hooks and actions on the code editor.
                <br />
                <br />
                It is also possible to edit manually the <strong>package.json</strong> file to install shared libraries
                using the code editor
              </div>
            }
          />
        )}

        <div className={style.container}>
          {page === 'add' && <AddLibrary axios={props.bp.axios} {...commonProps} />}
          {page === 'view' && <ViewLibrary axios={props.bp.axios} lib={lib} {...commonProps} />}
        </div>
      </div>
    </Container>
  )
}

export default MainView
