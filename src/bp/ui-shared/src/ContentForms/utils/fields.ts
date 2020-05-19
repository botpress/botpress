const image = {
  advancedSettings: [
    {
      key: 'markdown',
      defaultValue: true,
      label: 'Use Markdown',
      moreInfo: {
        label: 'Learn more',
        url: 'https://daringfireball.net/projects/markdown/'
      }
    },
    {
      key: 'typingIndicator',
      defaultValue: true,
      label: 'Display typing indicator'
    }
  ],
  fields: [
    {
      type: 'upload',
      key: 'image',
      label: 'Upload Image'
    },
    {
      type: 'text',
      key: 'title',
      label: 'Title',
      placeholder: 'Optional'
    },
  ]
}

const card = {
  advancedSettings: [
    {
      key: 'markdown',
      defaultValue: true,
      label: 'Use Markdown',
      moreInfo: {
        label: 'Learn more',
        url: 'https://daringfireball.net/projects/markdown/'
      }
    },
    {
      key: 'typingIndicator',
      defaultValue: true,
      label: 'Display typing indicator'
    }
  ],
  fields: [
    {
      type: 'upload',
      key: 'image',
      label: 'Upload Image'
    },
    {
      type: 'text',
      key: 'title',
      label: 'Title',
      placeholder: 'What is your card subject?'
    },
    {
      type: 'text',
      key: 'text',
      label: 'Text',
      placeholder: 'Optional'
    },
    {
      addLabel: 'Add Button',
      type: 'group',
      key: 'buttons',
      label: 'fields::buttonText',
      fields: [
        {
          type: 'text',
          key: 'buttonText',
          label: 'Button Text',
          placeholder: 'What is written on the button?'
        },
        {
          type: 'select',
          key: 'action',
          label: 'Button Action',
          options: [
            {
              value: 'say',
              label: 'Say',
              related: {
                placeholder: 'What will your chatbot say ?',
                type: 'text',
                key: 'text',
                label: 'Text'
              }
            },
            {
              value: 'openUrl',
              label: 'Open Url',
              related: {
                placeholder: 'Write a valid URL',
                type: 'url',
                key: 'text',
                label: 'URL'
              }
            },
            {
              value: 'postBack',
              label: 'Post Back',
              related: {
                type: 'textarea',
                key: 'text',
                label: 'Payload'
              }
            }
          ]
        }
      ],
      contextMenu: [
        {
          type: 'delete',
          label: 'Delete Button'
        }
      ]
    }
  ]
}

const carousel = {
  advancedSettings: [
    {
      key: 'markdown',
      defaultValue: true,
      label: 'Use Markdown',
      moreInfo: {
        label: 'Learn more',
        url: 'https://daringfireball.net/projects/markdown/'
      }
    },
    {
      key: 'typingIndicator',
      defaultValue: true,
      label: 'Display typing indicator'
    }
  ],
  fields: [
    {
      addLabel: 'Add Card',
      type: 'group',
      key: 'cards',
      label: 'fields::title',
      fields: card.fields,
      minimum: 1,
      contextMenu: [
        {
          type: 'delete',
          label: 'Delete Card'
        }
      ]
    }
  ]
}

const suggestions = {
  advancedSettings: [
    {
      key: 'onTopOfKeyboard',
      defaultValue: true,
      label: 'Display on top of the keyboard',
    },
    {
      key: 'typingIndicator',
      defaultValue: true,
      label: 'Display typing indicator'
    },
    {
      key: 'canAdd',
      label: 'Allow user to add suggestions'
    },
    {
      key: 'multiple',
      label: 'Allow user to pick multiple suggestions'
    }
  ],
  fields: [
    {
      addLabel: 'Add Suggestion',
      type: 'group',
      key: 'suggestions',
      label: 'fields::label',
      minimum: 1,
      fields: [
        {
          type: 'text',
          key: 'label',
          label: 'Suggestion Label',
          placeholder: 'What is the suggestion displayed?'
        },
        {
          type: 'text',
          key: 'value',
          label: 'Value',
          placeholder: 'What will your chatbot receive?'
        }
      ],
      contextMenu: [
        {
          type: 'delete',
          label: 'Delete Suggestion'
        }
      ]
    }
  ]
}

export const getEmptyFormData = (contentType: string, isPartOfGroup = false) => {
  switch (contentType) {
    case 'image':
      return {
        markdown: true,
        typingIndicator: true,
        image: null,
        title: ''
      }
    case 'card':
      const advanced = isPartOfGroup ? {} : { markdown: true, typingIndicator: true }
      return {
        ...advanced,
        image: null,
        title: '',
        text: '',
        buttons: []
      }
    case 'carousel':
      return {
        markdown: true,
        typingIndicator: true,
        cards: [getEmptyFormData('card', true)]
      }
    case 'suggestions':
      return {
        onTopOfKeyboard: true,
        typingIndicator: true,
        suggestions: [
          {
            label: '',
            value: ''
          }
        ]
      }
  }
}

export const contentTypesFields = {
  image,
  card,
  carousel,
  suggestions
}
