import {
  Breadcrumbs,
  Button,
  ControlGroup,
  InputGroup,
  Intent,
  Menu,
  MenuItem,
  Popover,
  Position
} from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { AccessControl } from 'botpress/utils'
import React, { useEffect, useState } from 'react'

import style from './style.scss'
import Editor from './Editor'
import { ExportButton } from './ExportButton'
import { ImportModal } from './ImportModal'
import Item from './Item'

interface Props {
  bp: any
  topicName: string
}

interface QnaEntry {
  id: string
  data: any
}

export const LiteEditor = props => {
  const [filter, setFilter] = useState('')
  const [editId, setEditId] = useState('')
  const [isEditing, setEditing] = useState(false)
  const [data, setData] = useState<QnaEntry[]>()
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    fetchData()
  }, [])

  const getQueryParams = () => {
    return {
      params: {
        categories: [props.topicName]
      }
    }
  }

  const fetchData = async () => {
    const { data } = await props.bp.axios.get('/mod/qna/questions', getQueryParams())
    setData(data.items)
  }

  const createNew = () => {
    setEditId('')
    setEditing(true)
  }

  const editItem = itemId => {
    setEditId(itemId)
    setEditing(true)
  }

  const cancelEditing = () => setEditing(false)

  const deleteItem = async (id: string) => {
    const needDelete = await confirmDialog('Do you want to delete the question?', {
      acceptLabel: 'Delete'
    })

    if (needDelete) {
      const { data } = await props.bp.axios.post(`/mod/qna/questions/${id}/delete`, getQueryParams())
      setData(data.items)
    }
  }

  const toggleEnableItem = async (item: any, id: string, isChecked: boolean) => {
    item.enabled = isChecked

    const { data } = await props.bp.axios.post(`/mod/qna/questions/${id}`, item, getQueryParams())
    setData(data.items)
  }

  const categories = [{ label: props.topicName, value: props.topicName }]

  return (
    <div>
      {!isEditing && (
        <div className={style.liteHeader}>
          <div className={style.liteSearch}>
            <ControlGroup>
              <InputGroup
                id="input-search"
                placeholder="Search for a question"
                tabIndex={1}
                value={filter}
                onChange={e => setFilter(e.currentTarget.value)}
              />

              <AccessControl resource="module.qna" operation="write">
                <Button
                  id="btn-create-qna"
                  text="Add new"
                  icon="add"
                  style={{ marginLeft: 20 }}
                  intent={Intent.PRIMARY}
                  onClick={() => createNew()}
                />
              </AccessControl>
            </ControlGroup>
          </div>

          {/*
          TODO: Support for import/export scoped to a category
          <div>
            <Popover minimal position={Position.BOTTOM} captureDismiss>
              <Button id="btn-menu" icon="menu" minimal style={{ float: 'right' }} />
              <Menu>
                <MenuItem
                  icon="download"
                  id="btn-importJson"
                  text="Import JSON"
                  onClick={() => setImportDialogOpen(true)}
                />

                <ExportButton asMenu />
              </Menu>
            </Popover>
            <ImportModal
              isOpen={importDialogOpen}
              toggle={() => setImportDialogOpen(!importDialogOpen)}
              axios={props.bp.axios}
              onImportCompleted={fetchData}
            />
          </div> */}
        </div>
      )}

      {!isEditing && data && (
        <div className={style.liteItemContainer}>
          {data.map(item => (
            <Item
              key={item.id}
              id={item.id}
              item={item.data}
              isVersion2
              contentLang={props.contentLang}
              onEditItem={editItem}
              onDeleteItem={deleteItem}
              onToggleItem={toggleEnableItem}
            />
          ))}
        </div>
      )}
      <div>
        {isEditing && (
          <div>
            <Breadcrumbs
              items={[
                { onClick: cancelEditing, icon: 'folder-close', text: 'Q&A' },
                { icon: 'folder-close', text: editId !== '' ? 'Edit Q&A' : 'Create a new Q&A' }
              ]}
            />

            <Editor
              {...{ ...props }}
              closeQnAModal={cancelEditing}
              fetchData={fetchData}
              id={editId}
              isEditing={editId !== ''}
              page={{ offset: 0, limit: 500 }}
              categories={categories}
              updateQuestion={questions => setData(questions.items)}
              filters={{ question: filter, categories }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
