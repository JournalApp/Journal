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
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Elements } from '@stripe/react-stripe-js';
import type { Price } from '@/types';
import { useUserContext } from '@/context';
import { getCustomer } from '../../../../context/UserContext/subscriptions';
import { CheckoutModalStyled } from './styled';
import { Modal } from './Modal';

interface SubscribeProps {
  renderTrigger: any;
  prices: Price[];
}

////////////////////////////
// 🍔 ChangeCycle component
////////////////////////////

const ChangeCycle = ({ renderTrigger, prices }: SubscribeProps) => {
  logger('ChangeCycle rerender');
  const [open, setOpen] = useState(false);
  const [stripePromise, setStripePromise] = useState<any | null>(null);
  const nodeId = useFloatingNodeId();
  const { session } = useUserContext();

  useQuery({
    queryKey: ['stripePromise'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do';
      const { publishableKey } = await fetch(`${url}/api/v1/config`).then((r) => r.json());
      setStripePromise(() => loadStripe(publishableKey));
      return publishableKey;
    },
  });

  const { isLoading: billingInfoIsLoading, data: billingInfo } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => getCustomer(session.access_token),
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
        event: 'settings billing plan',
        properties: { action: 'upgrade-to-yearly' },
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
                    setOpen={setOpen}
                    prices={prices}
                    billingInfo={billingInfo}
                    billingInfoIsLoading={billingInfoIsLoading}
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

export { ChangeCycle };
