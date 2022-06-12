import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createCssVars, supabase } from 'utils'
import { Login } from 'components'
import { Session } from '@supabase/supabase-js'

interface UserContextInterface {
  session: Session
  authError: string
  signOut: () => void
  quitAndInstall: () => void
  secretKey: string
}

const UserContext = createContext<UserContextInterface | null>(null)

export function UserProvider({ children }: any) {
  const [session, setSession] = useState<Session | null>(null)
  const [authError, setAuthError] = useState('')
  const secretKey = '55xuIvNUNu29GnfN98oB9ghH-elgHliK'

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
    secretKey,
  }
  return <UserContext.Provider value={state}>{session ? children : <Login />}</UserContext.Provider>
}

export function useUserContext() {
  return useContext(UserContext)
}
