import firebase from '../utils/firebase'
import ms from 'ms'

export const SESSION_KEY = 'bp/licensing/session'

export function getSession() {
  const ls = localStorage.getItem(SESSION_KEY)
  return (ls && JSON.parse(ls)) || { token: null, email: null, expires: 0 }
}

export function setSession(params) {
  const ls = JSON.stringify({
    ...params,
    expires: new Date().getTime() + ms('4h'),
    time: new Date()
  })

  localStorage.setItem(SESSION_KEY, ls)
}

export function getToken() {
  const session = getSession()
  return session && session.token
}

export async function login({ email, password }) {
  return firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(result => {
      setSession({
        email: result.user.email,
        name: result.user.displayName,
        token: result.user.ra
      })
    })
}

export async function register({ email, password }) {
  return firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(result => {
      setSession({
        email: result.user.email,
        name: result.user.displayName,
        token: result.user.ra
      })

      firebase.auth().currentUser.sendEmailVerification()
    })
}

export async function sendResetPassword({ email }) {
  return firebase.auth().sendPasswordResetEmail(email)
}

export async function logout() {
  firebase.auth().signOut()
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated() {
  const { token, expires } = getSession()
  return token && new Date().getTime() < expires
}
