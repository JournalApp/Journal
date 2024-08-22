import React, { useState, useEffect } from 'react';
import { theme } from '@/themes';
import { isDev, logger } from '@/utils';
import {
  useFloating,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react';
import { loadStripe } from '@stripe/stripe-js/pure';
import { useQuery } from '@tanstack/react-query';
import { CheckoutModalStyled } from './styled';
import { Modal } from './Modal';
import { Elements } from '@stripe/react-stripe-js';
import { useUserContext } from '@/context';
import { getCustomer, fetchCountries } from '../../../../context/UserContext/subscriptions';

interface AddCardProps {
  renderTrigger: any;
  isUpdate?: boolean;
}

//////////////////////////
// 🍔 AddCard component
//////////////////////////

const AddCard = ({ renderTrigger, isUpdate = false }: AddCardProps) => {
  logger('AddCard rerender');
  const { session } = useUserContext();
  const [stripePromise, setStripePromise] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const nodeId = useFloatingNodeId();

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });

  const {
    isLoading: billingInfoIsLoading,
    data: billingInfo,
    refetch: refetchBillingInfo,
  } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => getCustomer(session.access_token),
  });

  useQuery({
    queryKey: ['stripePromise'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do';
      const { publishableKey } = await fetch(`${url}/api/v1/config`).then((r) => r.json());
      setStripePromise(() => loadStripe(publishableKey));
      return publishableKey;
    },
  });

  const { context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: false,
    }),
  ]);

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }
  };

  //////////////////////////
  // 🏓 useEffect
  //////////////////////////

  useEffect(() => {
    logger('✅ addEventListener');
    document.addEventListener('keydown', handleCloseEsc);

    return () => {
      logger('❌ removeEventListener');
      document.removeEventListener('keydown', handleCloseEsc);
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings billing payment-method',
        properties: { action: isUpdate ? 'update' : 'add' },
      });
    }
  }, [open]);

  //////////////////////////
  // 🚀 Return
  //////////////////////////

  return (
    <FloatingNode id={nodeId}>
      {renderTrigger({ open: () => setOpen(true), ref: refs.setReference, ...getReferenceProps() })}
      <FloatingPortal>
        {open && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: theme('color.primary.surface', 0.8),
              zIndex: 1010,
            }}
          >
            <FloatingFocusManager context={context}>
              <CheckoutModalStyled ref={refs.setFloating} {...getFloatingProps()}>
                <Elements stripe={stripePromise}>
                  <Modal
                    isUpdate={isUpdate}
                    setOpen={setOpen}
                    billingInfo={billingInfo}
                    billingInfoIsLoading={billingInfoIsLoading}
                    refetchBillingInfo={refetchBillingInfo}
                    countries={countries}
                  />
                </Elements>
              </CheckoutModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
};

export { AddCard };
