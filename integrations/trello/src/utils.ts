export const keepOnlySetProperties = (obj: object) =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => !!v))

export const canonicalize = (identifier: string) =>
    identifier.trim().toUpperCase().normalize()

export const nameCompare = (name1: string, name2: string) =>
    canonicalize(name1) === canonicalize(name2)
