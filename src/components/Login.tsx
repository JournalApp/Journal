import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useUserContext } from 'context'
import { Splash } from 'components'
import { supabase, isDev, logger } from 'utils'
import logo from '../../assets/icons/journaldo-logo@2x.png'

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

const Welcome = styled.h1`
  font-weight: 500;
  font-size: 28px;
  line-height: 34px;
  text-align: center;
  letter-spacing: -0.03em;
  color: ${theme('color.primary.main')};
  margin: 40px 0 32px 0;
`

const LoginButton = styled.a`
  font-weight: 600;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
  letter-spacing: -0.03em;
  color: ${theme('color.primary.surface')};
  background-color: ${theme('color.primary.main')};
  padding: 16px 40px;
  border-radius: 100px;
  text-decoration: none;
  white-space: nowrap;
  outline: 0;
`

const ErrorMessage = styled.div`
  color: ${theme('color.error.main')};
`

const RTForm = styled.form`
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
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
  width: -webkit-fill-available;
  outline: 0;
  &:focus {
    border: 1px solid ${theme('color.secondary.hover')};
  }
`

const RTError = styled.div`
  font-size: 16px;
  padding: 17px;
  display: block;
  margin: 4px;
  color: ${theme('color.error.main')};
`

const Logo = styled.img`
  width: 64px;
  height: 64px;
`

const LoginWithToken = () => {
  const [authError, setAuthError] = useState('')
  const rt = useRef(null)

  const keyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let refreshToken = rt.current.value
      const { error } = await supabase.auth.signIn({ refreshToken })
      if (error) {
        logger(error)
        setAuthError(error.message)
      }
    } else {
      setAuthError('')
    }
  }

  const change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    logger(e.target.value)
    try {
      const url = new URL(e.target.value)
      logger(url.host)
      const refreshToken = url.searchParams.get('refresh_token')
      const { error } = await supabase.auth.signIn({ refreshToken })
      if (error) {
        logger(error)
        setAuthError(error.message)
      }
    } catch {
      logger('no refresh_token found')
    }
  }

  return (
    <RTForm onSubmit={(e) => e.preventDefault()}>
      <RTError>{authError}</RTError>
      <RTInput
        placeholder='Type refresh token and hit enter'
        type='text'
        name='refresh_token'
        ref={rt}
        onKeyDown={(e) => keyPress(e)}
        onChange={(e) => change(e)}
      ></RTInput>
    </RTForm>
  )
}

const Login = () => {
  const { authError, session } = useUserContext()

  const log = () => {
    let lastUser = window.electronAPI.app.getKey('lastUser')
    window.electronAPI.capture({
      distinctId: lastUser,
      event: 'user login-with-browser',
    })
  }

  return (
    <>
      <Splash />
      <Container>
        <Logo src={logo}></Logo>
        <Welcome>Welcome to Journal</Welcome>
        <LoginButton href='https://www.journal.do/auth?action=signout' onClick={() => log()}>
          Log in with browser
        </LoginButton>
        <ErrorMessage>{authError}</ErrorMessage>
        {isDev() && <LoginWithToken />}
      </Container>
    </>
  )
}

export { Login }
