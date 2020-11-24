import { Button, InputGroup, Radio, RadioGroup } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import React, { useState } from 'react'

import style from './style.scss'
import Dropdown from './Dropdown'
import TaskResult from './TaskResult'
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
  const [result, setResult] = useState('')
  const [processing, setProcessing] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [source, setSource] = useState('npm')

  const searchChanged = async (query, event) => {
    if (event) {
      const { data } = await props.axios.get(`/mod/libraries/search/${query}`)

      setItems(data)
      setResult('')
      setRepoName('')
    }
  }

  const addLib = async () => {
    setProcessing(true)

    try {
      const { data } = await props.axios.post('/mod/libraries/add', {
        name: repoName || activeItem.name,
        version: activeItem?.version
      })

      setResult(data)
      props.refreshLibraries()
    } catch (err) {
      toast.failure(err)
    } finally {
      setProcessing(false)
    }
  }

  const changeSource = source => {
    setSource(source)
    setResult('')
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
          <Dropdown items={items} onChange={val => setActiveItem(val)} onQueryChange={searchChanged} />

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
              <Button
                onClick={addLib}
                disabled={processing}
                text={lang.tr(processing ? 'pleaseWait' : 'Add Library')}
              ></Button>
            </div>
          )}
        </div>
      )}

      {source === 'github' && (
        <div>
          <h5>Add from a GitHub repository</h5>
          <InputGroup placeholder="botpress/botpress#master" onChange={e => setRepoName(e.currentTarget.value)} />
          <Button onClick={addLib} disabled={processing} text={processing ? 'Please wait...' : 'Add Library'}></Button>
        </div>
      )}

      {source === 'archive' && (
        <div>
          <h5>Upload archive</h5>
          <UploadLibrary {...props} />
        </div>
      )}

      <TaskResult message={result} />
    </div>
  )
}

export default AddLibrary
