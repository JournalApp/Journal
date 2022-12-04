import React, { useState, useEffect, useRef } from 'react'
import { useUserContext } from 'context'
import { UpgradeButtonStyled, LimitReachedTextStyled, LimitReachedWrapperStyled } from './styled'

const LimitReached = () => {
  const { invokeOpenSettings } = useUserContext()

  return (
    <LimitReachedWrapperStyled>
      <LimitReachedTextStyled>Free plan limit reached...</LimitReachedTextStyled>
      <UpgradeButtonStyled onClick={invokeOpenSettings.current}>Upgrade</UpgradeButtonStyled>
    </LimitReachedWrapperStyled>
  )
}

export { LimitReached }
