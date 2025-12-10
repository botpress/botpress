import * as sdk from '@botpress/sdk'

// ============================================
// Reusable Sub-Schemas
// ============================================

const colorEnum = sdk.z.enum([
  'default',
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'default_background',
  'gray_background',
  'brown_background',
  'orange_background',
  'yellow_background',
  'green_background',
  'blue_background',
  'purple_background',
  'pink_background',
  'red_background',
])

const annotationsSchema = sdk.z
  .object({
    bold: sdk.z.boolean().optional(),
    italic: sdk.z.boolean().optional(),
    strikethrough: sdk.z.boolean().optional(),
    underline: sdk.z.boolean().optional(),
    code: sdk.z.boolean().optional(),
    color: colorEnum.optional(),
  })
  .optional()

const richTextItemSchema = sdk.z.object({
  type: sdk.z.enum(['text', 'mention', 'equation']).optional(),
  text: sdk.z
    .object({
      content: sdk.z.string().describe('The text content'),
      link: sdk.z
        .object({
          url: sdk.z.string().url().describe('The URL to link to'),
        })
        .nullish(),
    })
    .optional(),
  annotations: annotationsSchema,
})

const richTextArraySchema = sdk.z
  .array(richTextItemSchema)
  .min(1)
  .title('Rich Text')
  .describe('Array of rich text objects containing the content')

const captionSchema = sdk.z
  .array(richTextItemSchema)
  .optional()
  .title('Caption')
  .describe('Optional caption for the media')

const externalUrlSchema = sdk.z.object({
  type: sdk.z.literal('external').optional(),
  external: sdk.z.object({
    url: sdk.z.string().url().describe('The external URL of the media'),
  }),
  caption: captionSchema,
})

const iconSchema = sdk.z
  .discriminatedUnion('type', [
    sdk.z.object({
      type: sdk.z.literal('emoji'),
      emoji: sdk.z.string().describe('An emoji character'),
    }),
    sdk.z.object({
      type: sdk.z.literal('external'),
      external: sdk.z.object({
        url: sdk.z.string().url().describe('The external URL of the icon'),
      }),
    }),
  ])
  .optional()

const languageEnum = sdk.z.enum([
  'abap',
  'agda',
  'arduino',
  'ascii art',
  'assembly',
  'bash',
  'basic',
  'bnf',
  'c',
  'c#',
  'c++',
  'clojure',
  'coffeescript',
  'coq',
  'css',
  'dart',
  'dhall',
  'diff',
  'docker',
  'ebnf',
  'elixir',
  'elm',
  'erlang',
  'f#',
  'flow',
  'fortran',
  'gherkin',
  'glsl',
  'go',
  'graphql',
  'groovy',
  'haskell',
  'hcl',
  'html',
  'idris',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'latex',
  'less',
  'lisp',
  'livescript',
  'llvm ir',
  'lua',
  'makefile',
  'markdown',
  'markup',
  'matlab',
  'mathematica',
  'mermaid',
  'nix',
  'notion formula',
  'objective-c',
  'ocaml',
  'pascal',
  'perl',
  'php',
  'plain text',
  'powershell',
  'prolog',
  'protobuf',
  'purescript',
  'python',
  'r',
  'racket',
  'reason',
  'ruby',
  'rust',
  'sass',
  'scala',
  'scheme',
  'scss',
  'shell',
  'smalltalk',
  'solidity',
  'sql',
  'swift',
  'toml',
  'typescript',
  'vb.net',
  'verilog',
  'vhdl',
  'visual basic',
  'webassembly',
  'xml',
  'yaml',
  'java/c/c++/c#',
])

// ============================================
// Individual Block Type Schemas
// ============================================

const paragraphBlockSchema = sdk.z.object({
  type: sdk.z.literal('paragraph'),
  paragraph: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the paragraph'),
  }),
})

const heading1BlockSchema = sdk.z.object({
  type: sdk.z.literal('heading_1'),
  heading_1: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the heading'),
    is_toggleable: sdk.z.boolean().optional().describe('Whether the heading is toggleable'),
  }),
})

const heading2BlockSchema = sdk.z.object({
  type: sdk.z.literal('heading_2'),
  heading_2: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the heading'),
    is_toggleable: sdk.z.boolean().optional().describe('Whether the heading is toggleable'),
  }),
})

const heading3BlockSchema = sdk.z.object({
  type: sdk.z.literal('heading_3'),
  heading_3: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the heading'),
    is_toggleable: sdk.z.boolean().optional().describe('Whether the heading is toggleable'),
  }),
})

const bulletedListItemBlockSchema = sdk.z.object({
  type: sdk.z.literal('bulleted_list_item'),
  bulleted_list_item: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the list item'),
  }),
})

const numberedListItemBlockSchema = sdk.z.object({
  type: sdk.z.literal('numbered_list_item'),
  numbered_list_item: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the list item'),
  }),
})

const quoteBlockSchema = sdk.z.object({
  type: sdk.z.literal('quote'),
  quote: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the quote'),
  }),
})

const toDoBlockSchema = sdk.z.object({
  type: sdk.z.literal('to_do'),
  to_do: sdk.z.object({
    rich_text: richTextArraySchema,
    checked: sdk.z.boolean().optional().describe('Whether the to-do is checked (defaults to false if not provided)'),
    color: colorEnum.optional().describe('The color of the to-do'),
  }),
})

const toggleBlockSchema = sdk.z.object({
  type: sdk.z.literal('toggle'),
  toggle: sdk.z.object({
    rich_text: richTextArraySchema,
    color: colorEnum.optional().describe('The color of the toggle'),
  }),
})

const templateBlockSchema = sdk.z.object({
  type: sdk.z.literal('template'),
  template: sdk.z.object({
    rich_text: richTextArraySchema,
  }),
})

const calloutBlockSchema = sdk.z.object({
  type: sdk.z.literal('callout'),
  callout: sdk.z.object({
    rich_text: richTextArraySchema,
    icon: iconSchema.describe('The icon of the callout'),
    color: colorEnum.optional().describe('The color of the callout'),
  }),
})

const codeBlockSchema = sdk.z.object({
  type: sdk.z.literal('code'),
  code: sdk.z.object({
    rich_text: richTextArraySchema,
    language: languageEnum.describe('The programming language of the code'),
    caption: captionSchema,
  }),
})

const imageBlockSchema = sdk.z.object({
  type: sdk.z.literal('image'),
  image: externalUrlSchema,
})

const videoBlockSchema = sdk.z.object({
  type: sdk.z.literal('video'),
  video: externalUrlSchema,
})

const pdfBlockSchema = sdk.z.object({
  type: sdk.z.literal('pdf'),
  pdf: externalUrlSchema,
})

const fileBlockSchema = sdk.z.object({
  type: sdk.z.literal('file'),
  file: sdk.z.object({
    type: sdk.z.literal('external').optional(),
    external: sdk.z.object({
      url: sdk.z.string().url().describe('The external URL of the file'),
    }),
    caption: captionSchema,
    name: sdk.z.string().optional().describe('The name of the file'),
  }),
})

const audioBlockSchema = sdk.z.object({
  type: sdk.z.literal('audio'),
  audio: externalUrlSchema,
})

const embedBlockSchema = sdk.z.object({
  type: sdk.z.literal('embed'),
  embed: sdk.z.object({
    url: sdk.z.string().url().describe('The URL to embed'),
    caption: captionSchema,
  }),
})

const bookmarkBlockSchema = sdk.z.object({
  type: sdk.z.literal('bookmark'),
  bookmark: sdk.z.object({
    url: sdk.z.string().url().describe('The URL to bookmark'),
    caption: captionSchema,
  }),
})

const equationBlockSchema = sdk.z.object({
  type: sdk.z.literal('equation'),
  equation: sdk.z.object({
    expression: sdk.z.string().describe('The LaTeX equation expression'),
  }),
})

const dividerBlockSchema = sdk.z.object({
  type: sdk.z.literal('divider'),
  divider: sdk.z.object({}).optional(),
})

const breadcrumbBlockSchema = sdk.z.object({
  type: sdk.z.literal('breadcrumb'),
  breadcrumb: sdk.z.object({}).optional(),
})

const tableOfContentsBlockSchema = sdk.z.object({
  type: sdk.z.literal('table_of_contents'),
  table_of_contents: sdk.z.object({
    color: colorEnum.optional().describe('The color of the table of contents'),
  }),
})

const linkToPageBlockSchema = sdk.z.object({
  type: sdk.z.literal('link_to_page'),
  link_to_page: sdk.z.discriminatedUnion('type', [
    sdk.z.object({
      type: sdk.z.literal('page_id'),
      page_id: sdk.z.string().describe('The ID of the page to link to'),
    }),
    sdk.z.object({
      type: sdk.z.literal('database_id'),
      database_id: sdk.z.string().describe('The ID of the database to link to'),
    }),
    sdk.z.object({
      type: sdk.z.literal('comment_id'),
      comment_id: sdk.z.string().describe('The ID of the comment to link to'),
    }),
  ]),
})

const tableRowBlockSchema = sdk.z.object({
  type: sdk.z.literal('table_row'),
  table_row: sdk.z.object({
    cells: sdk.z
      .array(sdk.z.array(richTextItemSchema))
      .describe('An array of cell contents, where each cell is an array of rich text objects'),
  }),
})

const tableBlockSchema = sdk.z.object({
  type: sdk.z.literal('table'),
  table: sdk.z.object({
    table_width: sdk.z.number().int().positive().describe('The width of the table (number of columns)'),
    has_column_header: sdk.z.boolean().optional().describe('Whether the table has a column header'),
    has_row_header: sdk.z.boolean().optional().describe('Whether the table has a row header'),
    children: sdk.z
      .array(
        sdk.z.object({
          type: sdk.z.literal('table_row').optional(),
          table_row: sdk.z.object({
            cells: sdk.z.array(sdk.z.array(richTextItemSchema)),
          }),
        })
      )
      .describe('Array of table row blocks that form the table'),
  }),
})

const columnListBlockSchema = sdk.z.object({
  type: sdk.z.literal('column_list'),
  column_list: sdk.z.object({
    children: sdk.z
      .array(
        sdk.z.object({
          type: sdk.z.literal('column').optional(),
          column: sdk.z.object({
            children: sdk.z
              .array(sdk.z.record(sdk.z.any()))
              .optional()
              .describe('Blocks within the column - can contain any block type except column_list and column'),
          }),
        })
      )
      .describe('Array of column blocks'),
  }),
})

const syncedBlockSchema = sdk.z.object({
  type: sdk.z.literal('synced_block'),
  synced_block: sdk.z.object({
    synced_from: sdk.z
      .object({
        type: sdk.z.literal('block_id').optional(),
        block_id: sdk.z.string().describe('The ID of the original synced block'),
      })
      .nullable()
      .describe('The original synced block. If null, this is the original synced block'),
  }),
})

// ============================================
// Main Discriminated Union Schema
// ============================================

export const blockSchema = sdk.z
  .discriminatedUnion('type', [
    // Text-based blocks
    paragraphBlockSchema,
    heading1BlockSchema,
    heading2BlockSchema,
    heading3BlockSchema,
    bulletedListItemBlockSchema,
    numberedListItemBlockSchema,
    quoteBlockSchema,
    toDoBlockSchema,
    toggleBlockSchema,
    templateBlockSchema,
    calloutBlockSchema,

    // Code and equations
    codeBlockSchema,
    equationBlockSchema,

    // Media blocks
    imageBlockSchema,
    videoBlockSchema,
    pdfBlockSchema,
    fileBlockSchema,
    audioBlockSchema,
    embedBlockSchema,
    bookmarkBlockSchema,

    // Layout and structure blocks
    dividerBlockSchema,
    breadcrumbBlockSchema,
    tableOfContentsBlockSchema,
    linkToPageBlockSchema,
    tableRowBlockSchema,
    tableBlockSchema,
    columnListBlockSchema,
    syncedBlockSchema,
  ])
  .describe('The block to append to the page. Select a block type and provide the required fields.')

export type NotionBlock = sdk.z.infer<typeof blockSchema>
