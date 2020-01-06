const axios = require('axios')

/**
 * Gets current weather
 * @title Get Weather
 * @category Weather
 * @author Botpress
 */
const myAction = async () => {
  const config = await bp.config.getModuleConfig('examples')
  const apiKey = config.openWeatherApiKey
  const query = event.payload.text

  let response
  try {
    response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${apiKey}`)
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Request failed with status code 401. Have you set up your OpenWeather API Key properly?')
    }
    throw error
  }

  const city = response.data.name
  const country = response.data.sys.country
  const temperature = response.data.main.temp
  const description = response.data.weather[0].description

  temp.weather = { city, country, temperature, description }
}

return myAction()
