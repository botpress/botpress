const getTypeByTrigger = trigger => (trigger === '@' ? 'mention' : `${trigger}mention`)

export default getTypeByTrigger
