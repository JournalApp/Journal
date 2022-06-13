import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createCssVars, supabase } from 'utils'
import { Login } from 'components'
import { Session } from '@supabase/supabase-js'

interface UserContextInterface {
  session: Session
  authError: string
  signOut: () => void
  quitAndInstall: () => void
  getSecretKey: () => Promise<CryptoKey>
}

const UserContext = createContext<UserContextInterface | null>(null)

export function UserProvider({ children }: any) {
  const [session, setSession] = useState<Session | null>(null)
  const [authError, setAuthError] = useState('')
  const secretKey = useRef(null)

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

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth event:')
      console.log(_event)
      console.log('Session:')
      console.log(session)
      setSession(session)
    })
  }, [])

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
  }
  return <UserContext.Provider value={state}>{session ? children : <Login />}</UserContext.Provider>
}

export function useUserContext() {
  return useContext(UserContext)
}
