import { Comment } from './comment'
import { Page } from './page'
import { PageToCreate } from './pageToCreate'

export const entities = {
  page: {
    title: 'Page',
    description: 'A page in confluence',
    schema: Page.schema,
  },
  pageToCreate: {
    title: 'Page To Create',
    description: 'A page in confluence',
    schema: PageToCreate.schema,
  },
  comment: {
    title: 'Comment',
    description: 'A comment on a page in confluence',
    schema: Comment.schema,
  },
}
