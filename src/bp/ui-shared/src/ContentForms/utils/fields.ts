export const contentTypesFields = {
  image: {
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
  },
  card: {
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
        label: 'fields.buttonText',
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
                key: 'say',
                label: 'Say',
                related: {
                  placeholder: 'What will your chatbot say ?',
                  type: 'text',
                  key: 'text',
                  label: 'Text'
                }
              },
              {
                key: 'openUrl',
                label: 'Open Url',
                related: {
                  placeholder: 'Write a valid URL',
                  type: 'url',
                  key: 'text',
                  label: 'URL'
                }
              },
              {
                key: 'postBack',
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
  },
  carousel: {
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
        key: 'buttons',
        label: 'fields.title',
        fields: 'card',
        contextMenu: [
          {
            type: 'delete',
            label: 'Delete Card'
          }
        ]
      }
    ]
  },
  suggestions: {
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
        label: 'fields.label',
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
}
