import * as firebase from 'firebase/app'
import 'firebase/auth'

// Move from legacy utils/firebase
// TODO make this env vars on the build server so it's easily replacable
var config = {
  apiKey: 'AIzaSyBorvBTBW8GbNjJSmhqLbJsu-SvzqTx5OY',
  authDomain: 'botpress-licensing.firebaseapp.com',
  databaseURL: 'https://botpress-licensing.firebaseio.com',
  projectId: 'botpress-licensing',
  storageBucket: '',
  messagingSenderId: '355555448753'
}
firebase.initializeApp(config)

export const getToken = async () => {
  return firebase.auth().currentUser.getIdToken()
}

export const getCurrentUser = () => {
  return firebase.auth().currentUser
}

// TODO verify signature
export const login = async ({ email, password }) => {
  return firebase.auth().signInWithEmailAndPassword(email, password)
}

// TODO verify signature
export const register = async ({ email, password }) => {
  return firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(result => {
      // TODO smth with res ?
      firebase.auth().currentUser.sendEmailVerification()
    })
}

// TODO verify signature
export const sendResetPassword = ({ email }) => {
  return firebase.auth().sendPasswordResetEmail(email)
}

export const logout = async () => {
  return firebase.auth().signOut()
}

export const isAuthenticated = () => {
  return !!firebase.auth().currentUser
}
