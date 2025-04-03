import * as notionhq from '@notionhq/client'
import * as notionToMd from 'notion-to-md'
import * as notionToMdExporter from 'notion-to-md/plugins/exporter'
import * as notionToMdRenderer from 'notion-to-md/plugins/renderer'
import { handleErrorsDecorator as handleErrors } from './error-handling'

export class NotionToMdxClient {
  private _notionToMdConverter?: notionToMd.NotionConverter
  private _notionToMdBuffer: Record<string, string> = {}

  public constructor(private _notion: notionhq.Client) {}

  @handleErrors('Failed to convert Notion page to MDX')
  public async convertNotionPageToMarkdown({ pageId }: { pageId: string }): Promise<string> {
    const converter = this._getNotionToMdConverter()
    await converter.convert(pageId)

    return this._popPageFromBuffer({ pageId })
  }

  private _getNotionToMdConverter() {
    if (!this._notionToMdConverter) {
      this._notionToMdConverter = new notionToMd.NotionConverter(this._notion)
        .withExporter(
          new notionToMdExporter.DefaultExporter({
            outputType: 'buffer',
            buffer: this._notionToMdBuffer,
          })
        )
        .withRenderer(
          new notionToMdRenderer.MDXRenderer({
            frontmatter: true,
          })
        )
        .configureFetcher({
          fetchPageProperties: true,
        })
    }
    return this._notionToMdConverter
  }

  private _popPageFromBuffer({ pageId }: { pageId: string }) {
    const markdown = Reflect.get(this._notionToMdBuffer, pageId)
    void Reflect.deleteProperty(this._notionToMdBuffer, pageId)

    return markdown
  }
}
