import React from 'react';
import { useUserContext } from '@/context';
import { UpgradeButtonStyled, LimitReachedTextStyled, LimitReachedWrapperStyled } from './styled';

const LimitReached = () => {
  const { invokeOpenSettings } = useUserContext();
  const { session } = useUserContext();

  const onClickHandler = () => {
    invokeOpenSettings.current(true);
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry upgrade-cta',
    });
  };

  return (
    <LimitReachedWrapperStyled>
      <LimitReachedTextStyled>Free plan limit reached...</LimitReachedTextStyled>
      <UpgradeButtonStyled onClick={onClickHandler}>Upgrade</UpgradeButtonStyled>
    </LimitReachedWrapperStyled>
  );
};

export { LimitReached };
