import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createCssVars, supabase, supabaseUrl, supabaseAnonKey } from 'utils'
import { Login } from 'components'
import { Session } from '@supabase/supabase-js'
import dayjs from 'dayjs'

interface UserContextInterface {
  session: Session
  authError: string
  signOut: () => void
  quitAndInstall: () => void
  getSecretKey: () => Promise<CryptoKey>
  serverTimeNow: () => string
}

const UserContext = createContext<UserContextInterface | null>(null)

export function UserProvider({ children }: any) {
  const [session, setSession] = useState<Session | null>(null)
  const [authError, setAuthError] = useState('')
  const secretKey = useRef(null)
  const serverClientTimeDelta = useRef(0) //  server time - client time = delta

  window.electronAPI.handleOpenUrl(async (event: any, value: any) => {
    const url = new URL(value)
    const refresh_token = url.searchParams.get('refresh_token')
    if (!session && refresh_token) {
      const { error } = await supabase.auth.signIn({ refreshToken: refresh_token })
      if (error && error.status == 400) {
        console.log(error)
        setAuthError('Expired link, please login again')
      } else {
        setAuthError('Error, please try again.')
      }
    }
  })

  useEffect(() => {
    setSession(supabase.auth.session())
    fetchServerTimeDelta()

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth event:')
      console.log(_event)
      console.log('Session:')
      console.log(session)
      setSession(session)
    })
  }, [])

  // TODO on app lauch this function is called for each entry
  // consider saving secretKey in SQLite
  const getSecretKey = async () => {
    if (secretKey.current) {
      return secretKey.current
    } else {
      const response = await fetch('https://kms.journal.do/key', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const { key } = await response.json()
      if (!key) throw new Error("Can't fetch key")

      let utf8Encoder = new TextEncoder()
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        utf8Encoder.encode(key),
        'AES-CTR',
        true,
        ['encrypt', 'decrypt']
      )
      secretKey.current = aesKey

      return aesKey
    }
  }

  const fetchServerTimeDelta = async () => {
    try {
      // Fetch server time
      const headers = {
        apikey: supabaseAnonKey,
        authorization: `Bearer: ${supabaseAnonKey}`,
      }
      const response = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD', headers })
      let headerDate = response.headers.get('date')

      // Calculate delta
      const dateServerTime = dayjs(new Date(headerDate))
      const dateClientTime = dayjs(new Date())
      const diff = dateServerTime.diff(dateClientTime, 'ms')
      console.log(`Delta (ms): ${diff}`)
      serverClientTimeDelta.current = diff
      // TODO save delta to SQLite
    } catch (error) {
      // TODO (error = offline) read delta from SQLite
      // save delta in serverClientTimeDelta.current
      console.log(error)
    }
  }

  const serverTimeNow = () => {
    const delta = serverClientTimeDelta.current
    const dateClientTime = dayjs(new Date())
    const computedServerTime = dateClientTime.add(delta, 'ms').toISOString()
    console.log(`Using delta(ms) of: ${delta}, to compute: ${computedServerTime}`)
    return computedServerTime
  }

  const signOut = () => {
    console.log('signOut')
    supabase.auth.signOut()
    window.electronAPI.storeIndex.clearAll()
    window.electronAPI.storeEntries.clearAll()
    window.electronAPI.storeUserPreferences.clearAll()
    window.electronAPI.reloadWindow()
  }

  const quitAndInstall = () => {
    console.log('quitAndInstall')
    window.electronAPI.quitAndInstall()
  }

  let state = {
    session,
    authError,
    signOut,
    quitAndInstall,
    getSecretKey,
    serverTimeNow,
  }
  return <UserContext.Provider value={state}>{session ? children : <Login />}</UserContext.Provider>
}

export function useUserContext() {
  return useContext(UserContext)
}
