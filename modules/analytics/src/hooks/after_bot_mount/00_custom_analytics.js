/*
Below is an example of how you can register your custom analytics.
You can also use this as a template. 

If you need help, please refer to the official guide at https://botpress.io/docs/developers/analytics.

Example:

const axios = require('axios')

const registerCustomAnalytics = async () => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
  const countGraph = {
    name: 'Total Users',
    type: 'count',
    description: 'Total number of users',
    variables: ['user-type']
  }
  const countUniqGraph = {
    name: 'Total Customers',
    type: 'countUniq',
    description: 'Total number of customers',
    variables: ['user-type~customer']
  }
  const percentGraph = {
    name: 'Percentage of visitors',
    type: 'percent',
    sumValues: true,
    description: 'Percentage of visitors / total users',
    variables: ['user-type~visitor', 'user-type']
  }
  const pieChart = {
    name: 'Percentage of users per type',
    type: 'piechart',
    description: 'Percentage of users per type',
    variables: ['user-type']
  }

  axios.post('/mod/analytics/graphs', countGraph, axiosConfig)
  axios.post('/mod/analytics/graphs', countUniqGraph, axiosConfig)
  axios.post('/mod/analytics/graphs', percentGraph, axiosConfig)
  axios.post('/mod/analytics/graphs', pieChart, axiosConfig)
}

return registerCustomAnalytics()
*/
