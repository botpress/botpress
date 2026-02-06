export const getAliasedName = (name: string, alias?: string) => (alias && alias !== name ? `${name}(${alias})` : name)
