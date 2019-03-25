//CHECKSUM:26fb27415920a14815b8667f772b5fe7063ce499bab94c6f4c6e51a5bccb00d2

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjAwX2N1c3RvbV9hbmFseXRpY3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEiLCJzb3VyY2VSb290IjoiL1ZvbHVtZXMvYnAvYm90cHJlc3MvbW9kdWxlcy9hbmFseXRpY3Mvc3JjL2JhY2tlbmQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQmVsb3cgaXMgYW4gZXhhbXBsZSBvZiBob3cgeW91IGNhbiByZWdpc3RlciB5b3VyIGN1c3RvbSBhbmFseXRpY3MuXG5Zb3UgY2FuIGFsc28gdXNlIHRoaXMgYXMgYSB0ZW1wbGF0ZS4gXG5cbklmIHlvdSBuZWVkIGhlbHAsIHBsZWFzZSByZWZlciB0byB0aGUgb2ZmaWNpYWwgZ3VpZGUgYXQgaHR0cHM6Ly9ib3RwcmVzcy5pby9kb2NzL2RldmVsb3BlcnMvYW5hbHl0aWNzLlxuXG5FeGFtcGxlOlxuXG5jb25zdCBheGlvcyA9IHJlcXVpcmUoJ2F4aW9zJylcblxuY29uc3QgcmVnaXN0ZXJDdXN0b21BbmFseXRpY3MgPSBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGF4aW9zQ29uZmlnID0gYXdhaXQgYnAuaHR0cC5nZXRBeGlvc0NvbmZpZ0ZvckJvdChib3RJZClcbiAgY29uc3QgY291bnRHcmFwaCA9IHtcbiAgICBuYW1lOiAnVG90YWwgVXNlcnMnLFxuICAgIHR5cGU6ICdjb3VudCcsXG4gICAgZGVzY3JpcHRpb246ICdUb3RhbCBudW1iZXIgb2YgdXNlcnMnLFxuICAgIHZhcmlhYmxlczogWyd1c2VyLXR5cGUnXVxuICB9XG4gIGNvbnN0IGNvdW50VW5pcUdyYXBoID0ge1xuICAgIG5hbWU6ICdUb3RhbCBDdXN0b21lcnMnLFxuICAgIHR5cGU6ICdjb3VudFVuaXEnLFxuICAgIGRlc2NyaXB0aW9uOiAnVG90YWwgbnVtYmVyIG9mIGN1c3RvbWVycycsXG4gICAgdmFyaWFibGVzOiBbJ3VzZXItdHlwZX5jdXN0b21lciddXG4gIH1cbiAgY29uc3QgcGVyY2VudEdyYXBoID0ge1xuICAgIG5hbWU6ICdQZXJjZW50YWdlIG9mIHZpc2l0b3JzJyxcbiAgICB0eXBlOiAncGVyY2VudCcsXG4gICAgc3VtVmFsdWVzOiB0cnVlLFxuICAgIGRlc2NyaXB0aW9uOiAnUGVyY2VudGFnZSBvZiB2aXNpdG9ycyAvIHRvdGFsIHVzZXJzJyxcbiAgICB2YXJpYWJsZXM6IFsndXNlci10eXBlfnZpc2l0b3InLCAndXNlci10eXBlJ11cbiAgfVxuICBjb25zdCBwaWVDaGFydCA9IHtcbiAgICBuYW1lOiAnUGVyY2VudGFnZSBvZiB1c2VycyBwZXIgdHlwZScsXG4gICAgdHlwZTogJ3BpZWNoYXJ0JyxcbiAgICBkZXNjcmlwdGlvbjogJ1BlcmNlbnRhZ2Ugb2YgdXNlcnMgcGVyIHR5cGUnLFxuICAgIHZhcmlhYmxlczogWyd1c2VyLXR5cGUnXVxuICB9XG5cbiAgYXhpb3MucG9zdCgnL21vZC9hbmFseXRpY3MvZ3JhcGhzJywgY291bnRHcmFwaCwgYXhpb3NDb25maWcpXG4gIGF4aW9zLnBvc3QoJy9tb2QvYW5hbHl0aWNzL2dyYXBocycsIGNvdW50VW5pcUdyYXBoLCBheGlvc0NvbmZpZylcbiAgYXhpb3MucG9zdCgnL21vZC9hbmFseXRpY3MvZ3JhcGhzJywgcGVyY2VudEdyYXBoLCBheGlvc0NvbmZpZylcbiAgYXhpb3MucG9zdCgnL21vZC9hbmFseXRpY3MvZ3JhcGhzJywgcGllQ2hhcnQsIGF4aW9zQ29uZmlnKVxufVxuXG5yZXR1cm4gcmVnaXN0ZXJDdXN0b21BbmFseXRpY3MoKVxuKi9cbiJdfQ==
