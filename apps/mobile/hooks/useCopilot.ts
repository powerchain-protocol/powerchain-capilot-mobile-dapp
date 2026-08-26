import { useCallback, useRef, useState } from 'react';

import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalRole } from '@/context/RoleContext';
import { ApiError } from '@/lib/http';
import { createCopilotResponse } from '@/services/copilot';
import type { ChatMessage, CopilotCreditCharge } from '@/types/copilot';

function messageId(prefix: 'user' | 'assistant', sequence: number) {
  return `${prefix}-${Date.now()}-${sequence}`;
}

type InsufficientCredits = {
  availableBaseUnits?: string;
  requiredBaseUnits?: string;
};

export function useCopilot() {
  const { session } = useAuthSession();
  const { role } = useOperationalRole();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [lastCharge, setLastCharge] = useState<CopilotCreditCharge>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const [insufficientCredits, setInsufficientCredits] = useState<InsufficientCredits>();
  const sequence = useRef(0);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isSending) return false;
      if (!session?.accessToken) {
        setError('Sign in before using metered Copilot responses.');
        return false;
      }

      sequence.current += 1;
      const userMessage: ChatMessage = {
        id: messageId('user', sequence.current),
        role: 'user',
        text,
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, userMessage]);
      setIsSending(true);
      setError(undefined);
      setInsufficientCredits(undefined);

      try {
        const agent = role === 'treasury' ? 'capital' : role === 'asset_manager' ? 'analyst' : role === 'admin' ? 'risk' : 'operator';
        const result = await createCopilotResponse({ message: text, conversationId, agent }, session.accessToken, `copilot:${userMessage.id}`);
        if (result.conversationId) setConversationId(result.conversationId);
        if (result.credits) setLastCharge(result.credits);

        sequence.current += 1;
        setMessages((current) => [
          ...current,
          {
            id: messageId('assistant', sequence.current),
            role: 'assistant',
            text: result.text,
            createdAt: Date.now(),
            provenance: result.provenance,
            messageUnit: result.messageUnit,
          },
        ]);
        return true;
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 402 && caught.code === 'INSUFFICIENT_PWRC_CREDITS') {
          const details = caught.details && typeof caught.details === 'object'
            ? caught.details as Record<string, unknown>
            : {};
          setInsufficientCredits({
            availableBaseUnits: typeof details.availableBaseUnits === 'string' ? details.availableBaseUnits : undefined,
            requiredBaseUnits: typeof details.requiredBaseUnits === 'string' ? details.requiredBaseUnits : undefined,
          });
          setError('Insufficient PWRC credits. Fund the account or claim the one-time sample grant, then retry.');
        } else {
          setError(caught instanceof Error ? caught.message : 'Unable to reach PowerChain Copilot.');
        }
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, role, session?.accessToken],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setLastCharge(undefined);
    setError(undefined);
    setInsufficientCredits(undefined);
  }, []);

  return {
    authenticated: Boolean(session?.accessToken),
    messages,
    conversationId,
    lastCharge,
    isSending,
    error,
    insufficientCredits,
    sendMessage,
    clearConversation,
  };
}
