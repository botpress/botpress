export interface Config {
  /**
   * @default ./qna
   */
  qnaDir: string
  /**
   * @default #builtin_text
   */
  textRenderer: string
  /**
   * @default botpress
   */
  qnaMakerKnowledgebase?: string
}
