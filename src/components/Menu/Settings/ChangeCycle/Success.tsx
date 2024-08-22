import React from 'react';
import { Icon } from '@/components';
import styled from 'styled-components';
import { theme } from '@/themes';
import { useQuery } from '@tanstack/react-query';
import { getCustomer } from '../../../../context/UserContext/subscriptions';
import { useUserContext } from '@/context';

const WrapperStyled = styled.div`
  padding: 16px 48px;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-direction: column;
`;

const MessageStyled = styled.div`
  color: ${theme('color.popper.main')};
  text-align: center;
  line-height: 20px;
  font-size: 14px;
`;

const ButtonStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  color: ${theme('color.popper.main')};
  background-color: transparent;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  border: 1px solid ${theme('color.popper.main')};
  outline: 0;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  opacity: 0.8;
  &:hover {
    box-shadow: 0 0 0 4px ${theme('color.popper.main', 0.15)};
  }
  &:focus {
    box-shadow: 0 0 0 4px ${theme('color.popper.main', 0.15)};
  }
`;

const Success = () => {
  const { session } = useUserContext();
  useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => getCustomer(session.access_token),
  });

  return (
    <WrapperStyled>
      <Icon name='Check' size={48} tintColor={theme('color.success.main')} />
      <MessageStyled>
        Success,
        <br />
        you are all set!
      </MessageStyled>
    </WrapperStyled>
  );
};

export { Success };
