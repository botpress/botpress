import { Colors, Icon, MenuItem, Position, Tooltip } from '@blueprintjs/core'
import { ItemRenderer, MultiSelect } from '@blueprintjs/select'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  contexts: string[]
  isSearch?: boolean
  className?: string
  bp: any
  saveContexts: (ctx: string[]) => void
}

export const ContextSelector: FC<Props> = props => {
  const [availableContexts, setContexts] = useState([])

  useEffect(() => {
    props.bp.axios.get(`/mod/nlu/contexts`).then(({ data }) => setContexts(data))
  }, [])

  const removeCtx = (_, idx: number) => {
    props.saveContexts([...props.contexts.slice(0, idx), ...props.contexts.slice(idx + 1)])
  }

  const addCtx = (ctx: string) => {
    if (availableContexts.indexOf(ctx) === -1) {
      setContexts([...availableContexts, ctx])
    }
    props.saveContexts([...props.contexts, ctx])
  }

  const onItemSelect = (ctx: string) => {
    const idx = props.contexts.indexOf(ctx)
    if (idx !== -1) {
      removeCtx(ctx, idx)
    } else {
      addCtx(ctx)
    }
  }

  const ctxItemRenderer: ItemRenderer<string> = (ctx, { handleClick, modifiers }) => (
    <MenuItem
      text={ctx}
      key={ctx}
      onClick={handleClick}
      active={modifiers.active}
      icon={props.contexts.indexOf(ctx) !== -1 ? 'tick' : 'blank'}
    />
  )

  const createNewItemRenderer = (query: string, active: boolean, handleClick) => (
    <MenuItem
      icon="plus"
      text={`Create "${query}"`}
      active={active}
      onClick={handleClick}
      shouldDismissPopover={false}
    />
  )

  return (
    <div className={props.className}>
      <div>
        {!props.isSearch && (
          <>
            <label htmlFor="selectContext">Contexts</label>
            &nbsp;
            <Tooltip content="You can type in the select bar to add new contexts." position={Position.RIGHT}>
              <Icon color={Colors.GRAY2} icon="info-sign" />
            </Tooltip>
          </>
        )}
      </div>

      <MultiSelect
        placeholder={props.isSearch ? 'Filter by contexts' : 'Select context...'}
        items={availableContexts}
        itemRenderer={ctxItemRenderer}
        itemPredicate={(q: string, ctx: string) => !q || ctx.includes(q)}
        onItemSelect={onItemSelect}
        tagRenderer={ctx => ctx}
        tagInputProps={{ tagProps: { minimal: true }, onRemove: removeCtx }}
        popoverProps={{ minimal: true, fill: true }}
        selectedItems={props.contexts}
        createNewItemRenderer={!props.isSearch && createNewItemRenderer}
        createNewItemFromQuery={q => q}
      />
    </div>
  )
}
