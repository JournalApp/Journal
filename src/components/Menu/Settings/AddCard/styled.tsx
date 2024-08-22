import styled from 'styled-components';
import { theme } from '@/themes';

const FormStyled = styled.form`
  width: 368px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.03em;
`;

const TextStyled = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
`;

const CheckoutModalStyled = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  gap: 16px;
  flex-direction: column;
  position: relative;
  padding: 0;
  padding: 40px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`;
const ActionsWrapperStyled = styled.div`
  display: flex;
  gap: 16px;
  height: 40px;
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
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
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

const ButtonGhostStyled = styled.button`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  padding: 2px 8px;
  color: ${theme('color.primary.main')};
  border: 0;
  border-radius: 6px;
  flex: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  transition: ${theme('animation.time.normal')} ease;
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
  }
  &:hover {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
    background-color: ${theme('color.popper.border')};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export {
  TextStyled,
  CheckoutModalStyled,
  ButtonStyled,
  Title,
  ActionsWrapperStyled,
  ButtonGhostStyled,
  FormStyled,
};
