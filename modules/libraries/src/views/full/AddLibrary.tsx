import { Button, ControlGroup, InputGroup, Radio, RadioGroup } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import React, { useState } from 'react'

import style from './style.scss'
import Dropdown from './Dropdown'
import PackageLib from './PackageLib'
import UploadLibrary from './UploadLibrary'

interface LibEntry {
  name: string
  date: string
  description: string
  version: string
  links: {
    npm: string
    bugs: string
    homepage: string
    repository: string
  }
}

const AddLibrary = props => {
  const [items, setItems] = useState([])
  const [activeItem, setActiveItem] = useState<LibEntry>()

  const [processing, setProcessing] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [source, setSource] = useState('npm')

  const searchChanged = async (query, event) => {
    if (event) {
      try {
        const { data } = await props.axios.get(`/mod/libraries/search/${query}`)

        setItems(data)
        setRepoName('')
      } catch (err) {
        toast.failure(`Error while querying the registry. ${err}`)
      }
    }
  }

  const addLib = async () => {
    setProcessing(true)

    try {
      await props.axios.post('/mod/libraries/add', {
        name: repoName || activeItem.name,
        version: activeItem?.version
      })

      toast.success('Library added successfully!')
      props.refreshLibraries()
    } catch (err) {
      toast.failure(`There was an error adding the library. Check server logs for more details ${err}`)
    } finally {
      setProcessing(false)
    }
  }

  const changeSource = source => {
    setSource(source)
  }

  const onItemChanged = async (item: LibEntry) => {
    setActiveItem(item)
    const { data } = await props.axios.get(`/mod/libraries/details/${item.name}`)
    console.log(data)
  }

  return (
    <div>
      <div className={style.title}>{lang.tr('module.libraries.addLibrary')}</div>
      <RadioGroup onChange={e => changeSource(e.currentTarget.value)} selectedValue={source}>
        <Radio label={lang.tr('module.libraries.searchNpm')} value="npm" />
        <Radio label={lang.tr('module.libraries.searchGithub')} value="github" />
        <Radio label={lang.tr('module.libraries.uploadArchive')} value="archive" />
      </RadioGroup>
      <br />

      {source === 'npm' && (
        <div>
          <h5>{lang.tr('search')}</h5>
          <Dropdown items={items} onChange={onItemChanged} onQueryChange={searchChanged} />

          {activeItem && (
            <div className={style.libInfo}>
              {lang.tr('name')}: {activeItem.name}
              <br />
              {lang.tr('description')}: {activeItem.description}
              <br />
              <br />
              <a href={activeItem.links.repository}>View on Github</a> | <a href={activeItem.links.bugs}>View Bugs</a>
              <br />
              <br />
              <div style={{ display: 'flex' }}>
                <Button
                  onClick={addLib}
                  disabled={processing}
                  text={lang.tr(processing ? 'pleaseWait' : 'Add Library')}
                />
                <PackageLib axios={props.axios} name={activeItem.name} version=""></PackageLib>
              </div>
            </div>
          )}
        </div>
      )}

      {source === 'github' && (
        <div>
          <h5>Add from a GitHub repository</h5>
          <ControlGroup>
            <InputGroup placeholder="botpress/botpress#master" onChange={e => setRepoName(e.currentTarget.value)} />
            <Button
              onClick={addLib}
              disabled={processing}
              text={processing ? 'Please wait...' : 'Add Library'}
            ></Button>
          </ControlGroup>
        </div>
      )}

      {source === 'archive' && (
        <div>
          <h5>Upload archive</h5>
          <UploadLibrary {...props} />
        </div>
      )}
    </div>
  )
}

export default AddLibrary
