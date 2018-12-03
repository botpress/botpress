export interface Config {
  /**
   * @default ./qna
   */
  qnaDir: string
  /**
   * @default #base_text
   */
  textRenderer: string
  /**
   * @default utf8
   */
  exportCsvEncoding: string
  qnaMakerApiKey?: string
  /**
   * @default botpress
   */
  qnaMakerKnowledgebase?: string
  /**
   * List of categories, separated by a comma
   */
  qnaCategories?: string
}
