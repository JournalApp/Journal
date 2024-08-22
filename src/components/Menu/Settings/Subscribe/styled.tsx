import styled from 'styled-components';
import { theme } from '@/themes';

const TextStyled = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
`;

const CheckoutModalStyled = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  position: relative;
  padding: 0;
  padding: 40px 32px 32px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`;

const ButtonStyled = styled.button`
  background-color: ${theme('color.popper.main')};
  color: ${theme('color.popper.inverted')};
  outline: 0;
  border: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  display: flex;
  margin-top: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.15)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export { TextStyled, CheckoutModalStyled, ButtonStyled };
