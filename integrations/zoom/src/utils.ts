export function cleanVtt(vtt: string): string {
  return vtt
    .replace(/WEBVTT\n/g, '')
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> .*\n/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
