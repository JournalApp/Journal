import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { logger, supabase, supabaseUrl, supabaseAnonKey } from 'utils'
import { Login } from 'components'
import { Session } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import { isDev } from 'utils'
import type { Subscription } from './types'
import { getSubscription } from './subscriptions'

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
  const subscription = useRef<Subscription | null>(null)

  logger('UserProvider re-render')

  window.electronAPI.handleOpenUrl(async (event: any, value: any) => {
    const url = new URL(value)
    const refresh_token = url.searchParams.get('refresh_token')
    if (!session && refresh_token) {
      const { error } = await supabase.auth.signIn({ refreshToken: refresh_token })
      if (error && error.status == 400) {
        logger(error)
        setAuthError('Expired link, please login again')
      } else {
        setAuthError('Error, please try again.')
      }
    }
  })

  const initSubscription = async () => {
    // const subState = {
    //   status: 'active',
    //   product_id: 'prod_2323'
    // }
    if (session?.access_token) {
      try {
        subscription.current = await getSubscription(session.access_token)
      } catch (error) {
        logger(error)
      }
    }
  }

  useEffect(() => {
    logger('Session changed')
    logger(session)
    initSubscription()
  }, [session])

  useEffect(() => {
    setSession(supabase.auth.session())
    let id = supabase.auth.session()?.user?.id ?? ''
    if (id) {
      window.electronAPI.user.add(id)
      window.electronAPI.app.setKey({ lastUser: id })
    }

    fetchServerTimeDelta()

    supabase.auth.onAuthStateChange((_event, newSession) => {
      logger(`Auth event: ${_event}`)
      setSession((prevSession) => {
        if (
          prevSession?.access_token == newSession?.access_token &&
          prevSession?.expires_at == newSession?.expires_at &&
          prevSession?.refresh_token &&
          newSession?.refresh_token
        ) {
          logger('Session the same')
          return prevSession
        } else {
          logger('Session is new')
          return newSession
        }
      })

      if (_event == 'SIGNED_IN') {
        window.electronAPI.user.add(newSession.user.id)
        window.electronAPI.app.setKey({ lastUser: newSession.user.id })
      }
    })
  }, [])

  const getSecretKey = async () => {
    if (secretKey.current) {
      logger('🔑 Using key from Ref')
      return secretKey.current
    } else {
      let key: string
      const cachedSecretKey = await window.electronAPI.user.getSecretKey(session.user.id)
      if (cachedSecretKey) {
        logger('🔑 Using key from SQLite')
        key = cachedSecretKey
      } else {
        logger('🔑 Fetching key from KMS')
        const kmsUrl = isDev() ? 'https://kms.journal.local/key' : 'https://kms.journal.do/key'
        const response = await fetch(kmsUrl, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const { key: fetchedKey } = await response.json()
        if (!fetchedKey) throw new Error("Can't fetch key")
        window.electronAPI.user.saveSecretKey(session.user.id, fetchedKey)
        key = fetchedKey
      }

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
      logger(`Delta (ms): ${diff}`)
      serverClientTimeDelta.current = diff
      // TODO save delta to SQLite
    } catch (error) {
      // TODO (error = offline) read delta from SQLite
      // save delta in serverClientTimeDelta.current
      logger(error)
    }
  }

  const serverTimeNow = () => {
    const delta = serverClientTimeDelta.current
    const dateClientTime = dayjs(new Date())
    const computedServerTime = dateClientTime.add(delta, 'ms').toISOString()
    logger(`Using delta(ms) of: ${delta}, to compute: ${computedServerTime}`)
    return computedServerTime
  }

  const signOut = () => {
    logger('signOut')
    supabase.auth.signOut()
    window.electronAPI.cache.deleteAll(session.user.id)
    // TODO detete tags
    window.electronAPI.reloadWindow()
  }

  const quitAndInstall = () => {
    logger('quitAndInstall')
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