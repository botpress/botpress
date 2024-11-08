const _canonicalize = (identifier: string) => identifier.trim().toUpperCase().normalize()

export const nameCompare = (name1: string, name2: string) => _canonicalize(name1) === _canonicalize(name2)
