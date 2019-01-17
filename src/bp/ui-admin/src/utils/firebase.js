import * as firebase from 'firebase/app'
import 'firebase/auth'

var config = {
  apiKey: 'AIzaSyBorvBTBW8GbNjJSmhqLbJsu-SvzqTx5OY',
  authDomain: 'botpress-licensing.firebaseapp.com',
  databaseURL: 'https://botpress-licensing.firebaseio.com',
  projectId: 'botpress-licensing',
  storageBucket: '',
  messagingSenderId: '355555448753'
}

firebase.initializeApp(config)

export default firebase
