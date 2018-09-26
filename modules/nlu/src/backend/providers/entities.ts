export default {
  // Date & Time
  '@native.date': { '@luis': 'datetimeV2', '@dialogflow': 'date', '@recast': 'datetime' },
  '@native.date-period': { '@luis': 'datetimeV2', '@dialogflow': 'date-period', '@recast': 'interval' },
  '@native.date-time': { '@luis': 'datetimeV2', '@dialogflow': 'date-time', '@recast': 'datetime' },
  '@native.time': { '@luis': 'datetimeV2', '@dialogflow': 'time', '@recast': 'datetime' },
  '@native.time-period': { '@luis': 'datetimeV2', '@dialogflow': 'time-period', '@recast': 'interval' },

  // Numbers
  '@native.cardinal': { '@dialogflow': 'cardinal', '@recast': 'cardinal' },
  '@native.flight-number': { '@dialogflow': 'flight-number' },
  '@native.number': { '@dialogflow': 'number', '@luis': 'number', '@recast': 'number' },
  '@native.number-integer': { '@dialogflow': 'number-integer', '@recast': 'ordinal' },
  '@native.number-sequence': { '@dialogflow': 'number-sequence' },
  '@native.ordinal': { '@luis': 'ordinal', '@dialogflow': 'ordinal', '@recast': 'ordinal' },

  // Amounts with Units
  '@native.age': { '@dialogflow': 'age' },
  '@native.duration': { '@dialogflow': 'duration', '@recast': 'duration' },
  '@native.percentage': { '@luis': 'percentage', '@dialogflow': 'percentage', '@recast': 'percent' },
  '@native.set': { '@recast': 'set' },
  '@native.temperature': { '@luis': 'temperature', '@dialogflow': 'temperature', '@recast': 'temperature' },
  '@native.unit-area': { '@luis': 'dimension', '@dialogflow': 'unit-area' },
  '@native.unit-currency': { '@luis': 'money', '@dialogflow': 'unit-currency', '@recast': 'money' },
  '@native.unit-information': { '@dialogflow': 'unit-information' },
  '@native.unit-length': { '@luis': 'dimension', '@dialogflow': 'unit-lenght', '@recast': 'distance' },
  '@native.unit-speed': { '@dialogflow': 'unit-speed', '@recast': 'speed' },
  '@native.unit-volume': { '@dialogflow': 'unit-volume', '@recast': 'volume' },
  '@native.unit-weight': { '@dialogflow': 'unit-weight', '@recast': 'mass' },

  // Unit Names
  '@native.currency-name': { '@dialogflow': 'currency-name' },
  '@native.unit-area-name': { '@dialogflow': 'unit-area-name' },
  '@native.unit-information-name': { '@dialogflow': 'unit-information-name' },
  '@native.unit-length-name': { '@dialogflow': 'unit-lenght-name' },
  '@native.unit-speed-name': { '@dialogflow': 'unit-speed-name' },
  '@native.unit-volume-name': { '@dialogflow': 'unit-volume-name' },
  '@native.unit-weight-name': { '@dialogflow': 'unit-weight-name' },

  // Geography
  '@native.address': { '@dialogflow': 'address', '@recast': 'location' },
  '@native.airport': { '@dialogflow': 'airport', '@recast': 'location' },
  '@native.geo-capital': { '@dialogflow': 'geo-capital' },
  '@native.geo-country': { '@dialogflow': 'geo-country', '@recast': 'location' },
  '@native.geo-country-code': { '@dialogflow': 'geo-country-code' },
  '@native.geo-city': { '@dialogflow': 'geo-city', '@recast': 'location' },
  '@native.geo-city-gb': { '@dialogflow': 'geo-city-gb', '@recast': 'location' },
  '@native.geo-city-us': { '@dialogflow': 'geo-city-us', '@recast': 'location' },
  '@native.geo-state-us': { '@dialogflow': 'geo-state-us', '@recast': 'location' },
  '@native.ip': { '@recast': 'ip' },
  '@native.location': { '@dialogflow': 'location', '@recast': 'location' },
  '@native.place-attraction-us': { '@dialogflow': 'place-attraction-us', '@recast': 'location' },
  '@native.place-attraction-gb': { '@dialogflow': 'place-attraction-gb', '@recast': 'location' },
  '@native.street-address': { '@dialogflow': 'street-address', '@recast': 'location' },
  '@native.zip-code': { '@dialogflow': 'zip-code', '@recast': 'location' },

  // Contacts
  '@native.email': { '@luis': 'email', '@dialogflow': 'email', '@recast': 'email' },
  '@native.phone-number': { '@luis': 'phonenumber', '@dialogflow': 'phone-number', '@recast': 'phone' },

  // Person
  '@native.given-name': { '@dialogflow': 'given-name' },
  '@native.last-name': { '@dialogflow': 'last-name' },
  '@native.name': { '@recast': 'person' },
  '@native.nationality': { '@recast': 'nationality' },

  // Music
  '@native.music-artist': { '@dialogflow': 'music-artist' },
  '@native.music-genre': { '@dialogflow': 'music-genre' },

  // Others
  '@native.color': { '@dialogflow': 'color', '@recast': 'color' },
  '@native.emoji': { '@recast': 'emoji' },
  '@native.job': { '@recast': 'job' },
  '@native.language': { '@dialogflow': 'language', '@recast': 'language' },
  '@native.organization': { '@recast': 'organization' },
  '@native.pronoun': { '@recast': 'pronoun' },
  '@native.sort': { '@recast': 'sort' },
  '@native.url': { '@luis': 'url', '@dialogflow': 'url', '@recast': 'url' },

  // Generic
  '@native.any': { '@dialogflow': 'any', '@rasa': 'any' }
}
