import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'

interface UserContextInterface {
  isUser: any
  user: any
  previousUser: any
  loginUser: any
  logoutUser: any
  loginVisible: any
  toggleLoginForm: any
  hideLoginForm: any
  toastsQueue: any
  sendToast: any
}

const UserContext = createContext<UserContextInterface | null>(null)

export function UserProvider({ children }: any) {
  const [user, setUser] = useState({})
  const [previousUser, setPreviousUser] = useState({})
  const [loginVisible, setLoginVisible] = useState(false)
  const [toastsQueue, setToastsQueue] = useState([])

  useEffect(() => {
    const savedUser = JSON.parse(window.localStorage.getItem('rioll-user'))
    if (savedUser) setUser({ ...savedUser })

    const savedPreviousUser = JSON.parse(window.localStorage.getItem('rioll-previous-user'))
    console.log(`savedPreviousUser: ${savedPreviousUser}`)
    if (savedPreviousUser) setPreviousUser({ ...savedPreviousUser })
  }, [])

  const loginUser = (newUser: any) => {
    window.localStorage.setItem('rioll-user', JSON.stringify(newUser))
    setUser({ ...newUser })

    window.localStorage.setItem('rioll-previous-user', JSON.stringify(newUser))
    setPreviousUser({ ...newUser })
  }

  const sendToast = ({ type, text }: any) => {
    let key = nanoid(6)
    setToastsQueue([...toastsQueue, { key, type, text }])
    setTimeout(() => {
      setToastsQueue((arr) => {
        return arr.filter((item) => item.key !== key)
      })
    }, 10000)
  }

  const logoutUser = async (e: any) => {
    e?.preventDefault()
    try {
      const res = await fetch('/api/user/auth', {
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        method: 'DELETE',
      })
      if (res.status == 200) {
        window.localStorage.removeItem('rioll-user')
        setUser({})
        //setToastsQueue([])
        if (e) sendToast({ type: 'success', text: 'Logged out successfully' })
      } else {
        throw new Error()
      }
    } catch {
      console.log('Unknown error')
    }
  }

  const isUser = () => {
    return Object.keys(user).length > 0 && user.constructor === Object
  }

  const toggleLoginForm = (e: any) => {
    e?.preventDefault()
    setLoginVisible(!loginVisible)
  }
  const hideLoginForm = (e: any) => {
    e?.preventDefault()
    setLoginVisible(false)
  }

  let state = {
    isUser,
    user,
    previousUser,
    loginUser,
    logoutUser,
    loginVisible,
    toggleLoginForm,
    hideLoginForm,
    toastsQueue,
    sendToast,
  }
  return <UserContext.Provider value={state}>{children}</UserContext.Provider>
}

export function useUserContext() {
  return useContext(UserContext)
}
