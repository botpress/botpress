import Recognizers from '@microsoft/recognizers-text-suite'
import { MicrosoftSupportedLanguage } from './typings'

export const supportedLangsList: MicrosoftSupportedLanguage[] = ['zh', 'nl', 'en', 'fr', 'de', 'it', 'ja', 'pt', 'es']
export const isSupportedLanguage = (lang: string): lang is MicrosoftSupportedLanguage => {
  return supportedLangsList.includes(lang as MicrosoftSupportedLanguage)
}

export const langToCulture = (lang: MicrosoftSupportedLanguage): string | undefined => {
  switch (lang) {
    case 'zh':
      return Recognizers.Culture.Chinese
    case 'nl':
      return Recognizers.Culture.Dutch
    case 'en':
      return Recognizers.Culture.English
    case 'fr':
      return Recognizers.Culture.French
    case 'de':
      return Recognizers.Culture.German
    case 'it':
      return Recognizers.Culture.Italian
    case 'ja':
      return Recognizers.Culture.Japanese
    case 'pt':
      return Recognizers.Culture.Portuguese
    case 'es':
      return Recognizers.Culture.Spanish
    default:
      return undefined
  }
}

export const GlobalRecognizers = [
  Recognizers.recognizePhoneNumber,
  Recognizers.recognizeIpAddress,
  Recognizers.recognizeMention,
  Recognizers.recognizeHashtag,
  Recognizers.recognizeEmail,
  Recognizers.recognizeURL,
  Recognizers.recognizeGUID
]

export const LanguageDependantRecognizers = [
  Recognizers.recognizeOrdinal,
  Recognizers.recognizeNumber,
  Recognizers.recognizePercentage,
  Recognizers.recognizeAge,
  Recognizers.recognizeCurrency,
  Recognizers.recognizeDimension,
  Recognizers.recognizeTemperature,
  Recognizers.recognizeDateTime,
  Recognizers.recognizeBoolean
]

export const DucklingUnitMapping = {
  volume: [
    'Barile',
    'Millilitre',
    'Baril',
    'Tablespoon',
    'Gallon',
    'Barril',
    'Volume unit',
    'Litro',
    'Cubic meter',
    'Pé cúbico',
    'Litre',
    'Liter',
    'Piede cubo',
    'Cubic foot',
    'Galón',
    'Centímetro cúbico',
    'Millilitro',
    'Pieds cube',
    'Teaspoon',
    'Onces',
    'Pie cúbico',
    'Milliliter',
    'Gallone',
    'Galão',
    'Mililitro'
  ],
  distance: [
    'Foot',
    'Pé',
    'Picometer',
    'Millimètres',
    'Kilometer',
    'Millimetro',
    'Pie',
    'Meter',
    'Micrometer',
    'Mile',
    'Pollice',
    'Light year',
    'Mètres',
    'Centimètres',
    'Millimeter',
    'Milímetro',
    'Hectomètre',
    'Décimètres',
    'Miglio',
    'Inch',
    'Metro',
    'Quilômetro',
    'Milha',
    'Nanometer',
    'Milla',
    'Kilómetro',
    'Pulgada',
    'Polegada',
    'Pied',
    'Kilomètres',
    'Pouce',
    'Piede',
    'Chilometro'
  ],
  quantity: [
    // Weight
    'Ounce',
    'Oncia',
    'Libra',
    'Metric ton',
    'Gallon',
    'Pound',
    'Kilogram',
    'Tonelada',
    'Tonne métrique',
    'Ton',
    'Barrel',
    'Tonelada métrica',
    'Onza',
    'Libbra',
    'Gram',
    'Tonnellata',
    'Onça',
    'Tonne',
    'Livre',
    // Area
    'Mètre carré',
    'Metro cuadrado',
    'Square decameter',
    'Square hectometer',
    'Square millimeter',
    'Chilometro quadrato',
    'Acro',
    'Quilômetro quadrado',
    'Square kilometer',
    'Square meter',
    'Kilómetro cuadrado',
    'Square decimeter',
    'Acre',
    'Metro quadrato',
    'Square centimeter',
    'Metro quadrado',
    'Hectare',
    'Kilomètre carré',
    // Bits
    'Kilobyte',
    'Terabyte',
    'bit',
    'Gigabyte',
    'Megabit',
    'Megabyte',
    'Bit',
    // Speed
    'Miles par heure',
    'Kilometer per hour',
    'Milla por hora',
    'Meter per second',
    "Miglia all'ora",
    'Mile per hour',
    'Milha por hora'
  ]
}

export const DucklingTypeMappings = {
  currency: 'amountOfMoney',
  email: 'email',
  number: 'number',
  ordinal: 'ordinal',
  phonenumber: 'phoneNumber',
  temperature: 'temperature',
  url: 'url'
}

export const DucklingDateMappings = {
  // https://docs.microsoft.com/en-us/azure/cognitive-services/luis/luis-reference-prebuilt-datetimev2?tabs=1-3%2C2-1%2C3-1%2C4-1%2C5-1%2C6-1
  'datetimeV2.datetimerange': 'duration',
  'datetimeV2.daterange': 'duration',
  'datetimeV2.timerange': 'duration',
  'datetimeV2.duration': 'duration',
  'datetimeV2.date': 'time',
  'datetimeV2.datetime': 'time',
  'datetimeV2.time': 'time'
}
