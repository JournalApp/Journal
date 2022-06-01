import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useUserContext } from 'context'
import { Icon } from 'components'
import { supabase } from 'utils'

const Container = styled.div`
  position: fixed;
  flex-direction: column;
  display: flex;
  gap: 8px;
  z-index: 9999;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
`

const LoginButton = styled.a``

const ErrorMessage = styled.div`
  color: ${theme('color.error.main')};
`

const RTForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const RTInput = styled.input`
  font-size: 16px;
  padding: 17px;
  display: block;
  margin: 4px;
  border-radius: 100px;
  border: 1px solid ${theme('color.primary.border')};
  background-color: ${theme('color.primary.surface')};
  color: ${theme('color.primary.main')};
`

const RTError = styled.div`
  font-size: 16px;
  padding: 17px;
  display: block;
  margin: 4px;
  color: ${theme('color.error.main')};
`

const LoginWithToken = () => {
  const [authError, setAuthError] = useState('')
  const rt = useRef(null)

  const keyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let refreshToken = rt.current.value
      const { error } = await supabase.auth.signIn({ refreshToken })
      if (error) {
        console.log(error)
        setAuthError(error.message)
      }
    } else {
      setAuthError('')
    }
  }

  return (
    <RTForm onSubmit={(e) => e.preventDefault()}>
      <RTInput
        placeholder='Type refresh token and hit enter'
        type='text'
        name='refresh_token'
        ref={rt}
        size={50}
        onKeyDown={(e) => keyPress(e)}
      ></RTInput>
      <RTError>{authError}</RTError>
    </RTForm>
  )
}

const Login = () => {
  const { authError } = useUserContext()

  return (
    <Container>
      <LoginButton href='https://www.journal.do/auth?action=signout'>Login in browser</LoginButton>
      <ErrorMessage>{authError}</ErrorMessage>
      <LoginWithToken />
    </Container>
  )
}

export { Login }
