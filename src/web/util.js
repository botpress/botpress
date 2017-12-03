export const hashCode = function(str) {
  let hash = 0
  if (str.length === 0) {
    return hash
  }

  for (let i = 0; i < str.length; i++) {
    let chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}
