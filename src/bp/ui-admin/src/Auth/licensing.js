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

export const registerAuthStateChanged = handler => {
  firebase.auth().onAuthStateChanged(handler)
}

export const getToken = async () => {
  return firebase.auth().currentUser.getIdToken()
}

export const getCurrentUser = () => {
  return firebase.auth().currentUser
}

export const login = async ({ email, password }) => {
  return firebase.auth().signInWithEmailAndPassword(email, password)
}

export const register = async ({ email, password }) => {
  return firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(({ user }) => user.sendEmailVerification())
}

export const sendResetPassword = ({ email }) => {
  return firebase.auth().sendPasswordResetEmail(email)
}

export const logout = async () => {
  return firebase.auth().signOut()
}
