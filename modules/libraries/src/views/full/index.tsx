import { confirmDialog, lang, toast, ModuleUI } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import AddLibrary from './AddLibrary'
import style from './style.scss'

export interface InstalledLibrary {
  name: string
  version: string
}

const { Container, ItemList, SidePanel, SidePanelSection, SplashScreen } = ModuleUI

const MainView = props => {
  const [libraries, setLibraries] = useState([])
  const [page, setPage] = useState('splash')
  const [lib, setLib] = useState<InstalledLibrary>()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        value: name,
        contextMenu: [
          {
            label: lang.tr('delete'),
            icon: 'delete',
            onClick: () => deleteLibrary(name)
          }
        ]
      }))
    )
  }

  const deleteLibrary = async (name: string) => {
    if (!(await confirmDialog(lang.tr('module.libraries.confirmRemove'), { acceptLabel: 'Remove' }))) {
      return
    }

    try {
      await props.bp.axios.post('/mod/libraries/delete', { name })
      await refreshLibraries()
      toast.info('module.libraries.deleteSuccess')
    } catch (err) {
      toast.failure('module.libraries.removeFailure')
    }
  }

  const handleLibClicked = item => {
    setLib(item.data)
  }

  const commonProps = { refreshLibraries, setPage }

  return (
    <Container>
      <SidePanel>
        <SidePanelSection
          label={lang.tr('module.libraries.libraries')}
          actions={[{ icon: 'add', tooltip: lang.tr('add'), onClick: () => setPage('add') }]}
        >
          <ItemList items={libraries} onElementClicked={handleLibClicked} />
        </SidePanelSection>
      </SidePanel>
      <div>
        <div className={style.beta}>{lang.tr('module.libraries.betaWarning')}</div>
        {page === 'splash' && (
          <SplashScreen
            icon="book"
            title={lang.tr('module.libraries.fullName')}
            description={
              <div>
                {lang.tr('module.libraries.splash.text1')}
                <br />
                <br />
                {lang.tr('module.libraries.splash.text2')}
              </div>
            }
          />
        )}

        <div className={style.container}>
          {page === 'add' && <AddLibrary axios={props.bp.axios} userProfile={props.userProfile} {...commonProps} />}
        </div>
      </div>
    </Container>
  )
}

export default MainView
