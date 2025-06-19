export const isValidGlob = (glob: string): boolean => {
  if (glob.split('*').length > 2) {
    // More than one * is not supported
    return false
  }

  return glob.trim().length > 0 && glob.trim().length <= 255
}

export const matchGlob = (url: string, glob: string): boolean => {
  url = url.toLowerCase().trim()
  glob = glob.toLowerCase().trim()

  // If glob is just *, it matches everything
  if (glob === '*') {
    return true
  }

  if (!glob.includes('*')) {
    // If glob doesn't contain any wildcard, we just check for presence
    return url.includes(glob)
  }

  // if starts with *, we check that url ends with glob
  if (glob.startsWith('*')) {
    const trimmedGlob = glob.slice(1) // Remove the leading *
    return url.endsWith(trimmedGlob)
  }

  // if ends with *, we check that url starts with glob
  if (glob.endsWith('*')) {
    const trimmedGlob = glob.slice(0, -1) // Remove the trailing *
    return url.startsWith(trimmedGlob)
  }

  // if * in the middle, we check that starts with the part before * and ends with the part after *
  if (glob.includes('*')) {
    const [start, end] = glob.split('*')
    return url.startsWith(start!) && url.endsWith(end!)
  }

  return false
}
