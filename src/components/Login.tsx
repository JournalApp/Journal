import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useUserContext } from 'context'
import { Icon } from 'components'

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

const Login = () => {
  const { authError } = useUserContext()
  return (
    <Container>
      <LoginButton href='https://www.journal.do/auth?action=signout'>Login in browser</LoginButton>
      <ErrorMessage>{authError}</ErrorMessage>
    </Container>
  )
}

export { Login }
