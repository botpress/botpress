import _ from 'lodash'

// Get the first 5 suggestions that match

const defaultSuggestionsFilter = (searchValue, suggestions) => {
  const value = searchValue
    .toLowerCase()
    .replace(/^{/, '')
    .replace(/}$/, '')
    .trim()

  let filteredSuggestions = suggestions.filter(
    suggestion => !value || suggestion.name.toLowerCase().indexOf(value) > -1
  )

  if (filteredSuggestions.length >= 5) {
    // We removed nested object suggestions when there's too many choices to display
    filteredSuggestions = filteredSuggestions.filter(
      x =>
        !filteredSuggestions.find(
          y =>
            x.name !== y.name &&
            x.category === y.category &&
            y.parentObject === x.parentObject &&
            x.name.startsWith(y.name)
        )
    )
  }

  const length = filteredSuggestions.length < 5 ? filteredSuggestions.length : 5
  return _.orderBy(filteredSuggestions.slice(0, length), x => x.name.length, 'asc')
}

export default defaultSuggestionsFilter
