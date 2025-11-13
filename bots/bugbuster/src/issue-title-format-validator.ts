const PATTERN = /^\w{0,} {0,}((\[.{1,}\])|(\(.{1,}\)))/

export function isIssueTitleFormatValid(title: string) {
  return !title.match(PATTERN)
}
