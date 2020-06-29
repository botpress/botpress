import Tags from '@yaireo/tagify/dist/react.tagify'
import React, { useRef, useState } from 'react'

export default Component => {
  return props => {
    const [currentWhitelist, setCurrentWhitelist] = useState<string[]>([])
    /*const elRef = useRef<HTMLElement>()

    if (elRef.current) {
      elRef.current?.addEventListener('keydown', e => {
        console.log(e)
      })
    }

    return <Component childRef={ref => (elRef.current = ref)} {...props} />*/

    const tagifyCallbacks = {
      // add: callback,
      // remove: callback,
      input: e => {
        const prefix = e.detail.prefix

        // first, clean the whitlist array, because the below code, while not, might be async,
        // therefore it should be up to you to decide WHEN to render the suggestions dropdown
        // tagify.settings.whitelist.length = 0

        if (prefix) {
          if (prefix == '$') {
            setCurrentWhitelist(['$_something', '$_something1', '$_something2', '$_something3', '$_something4'])
          }

          if (prefix == '{{') {
            setCurrentWhitelist(['{{_something', '{{_something1', '{{_something2', '{{_something3', '{{_something4'])
          }

          if (e.detail.value.length > 1) {
            e.detail.tagify.dropdown.show.call(e.detail.tagify, e.detail.value)
          }
        }

        console.log(e.detail.tagify.value)
      }
      // edit: callback,
      // invalid: callback,
      // click: callback,
      // keydown: callback,
      // focus: callback,
      // blur: callback,
      // "edit:input": callback,
      // "edit:updated": callback,
      // "edit:start": callback,
      // "edit:keydown": callback,
      // "dropdown:show": callback,
      // "dropdown:hide": callback,
      // "dropdown:select": callback
    }

    return (
      <Tags
        settings={{
          whitelist: currentWhitelist,
          dropdown: {
            classname: 'color-blue',
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 5,
            position: 'below', // place the dropdown near the typed text
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
            highlightFirst: true
          },
          callbacks: tagifyCallbacks,
          mode: 'mix',
          pattern: /\$|{{/
        }} // tagify settings object
        value="Some test"
        onChange={e => (e.persist(), console.log('CHANGED:', e.target.value))}
      />
    )
  }
}
