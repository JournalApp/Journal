import React, { useState, useEffect } from 'react';
import { theme } from '@/themes';
import { logger } from '@/utils';
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
import { useUserContext } from '@/context';
import {
  cancelSubscriptionImmediately,
  getSubscription,
} from '../../../../context/UserContext/subscriptions';
import {
  ModalStyled,
  ButtonDestructiveStyled,
  ButtonStyled,
  TitleStyled,
  DescriptionStyled,
  ActionsWrapperStyled,
} from './styled';

interface CancelImmediatelyProps {
  renderTrigger: any;
}

const CancelImmediately = ({ renderTrigger }: CancelImmediatelyProps) => {
  logger('CancelOrResume rerender');
  const { session, subscription } = useUserContext();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [poolingSubscription, setPoolingSubscription] = useState(false);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const nodeId = useFloatingNodeId();

  useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: async () => {
      setPoolingSubscription(true);
      logger('setPoolingSubscription(true)');
      return await getSubscription(session?.user.id, session.access_token);
    },
    refetchInterval: (data) => {
      logger(data);
      if (data == null) {
        logger('Subscription cencelled!');
        setPoolingSubscription(false);
        setSuccess(true);
        return false;
      } else {
        logger('Still there is a subscription...');
        return 2000;
      }
    },
    refetchIntervalInBackground: true,
    enabled: isCanceled == true,
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

  useEffect(() => {
    logger('✅ addEventListener');
    document.addEventListener('keydown', handleCloseEsc);

    return () => {
      logger('❌ removeEventListener');
      document.removeEventListener('keydown', handleCloseEsc);
    };
  }, []);

  useEffect(() => {
    if (success) {
      setOpen(false);
    }
  }, [success]);

  const cancelOrResume = async () => {
    setIsCanceling(true);
    try {
      await cancelSubscriptionImmediately({
        access_token: session.access_token,
        subscriptionId: subscription.id,
      });

      setIsCanceled(true);
      setIsCanceling(false);
    } catch (error) {
      logger(error);
      setIsCanceling(false);
      setIsCanceled(false);
    }
  };

  const cancelButtonText = () => {
    if (success) {
      return 'Done';
    } else if (poolingSubscription) {
      return 'Finalizing...';
    } else if (isCanceling) {
      return 'Canceling...';
    } else {
      return 'Cancel plan';
    }
  };

  const setOpenHandler = () => {
    setOpen(true);
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings billing plan',
      properties: { action: 'cancel-immediately' },
    });
  };

  return (
    <FloatingNode id={nodeId}>
      {renderTrigger({
        open: () => setOpenHandler(),
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
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
            <FloatingFocusManager context={context} initialFocus={0}>
              <ModalStyled ref={refs.setFloating} {...getFloatingProps()}>
                <TitleStyled>Oh no, cancel your plan?</TitleStyled>
                <DescriptionStyled>
                  If you proceed with canceling your plan, it will become inactive immediately.
                </DescriptionStyled>
                <ActionsWrapperStyled>
                  <ButtonDestructiveStyled
                    onClick={() => cancelOrResume()}
                    disabled={poolingSubscription || isCanceling}
                  >
                    {cancelButtonText()}
                  </ButtonDestructiveStyled>
                  <ButtonStyled
                    onClick={() => setOpen(false)}
                    disabled={poolingSubscription || isCanceling}
                  >
                    Keep plan
                  </ButtonStyled>
                </ActionsWrapperStyled>
              </ModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
};

export { CancelImmediately };
