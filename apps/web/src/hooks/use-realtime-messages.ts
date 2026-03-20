'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ref, query, orderByChild, startAfter, onChildAdded } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { messagesApi, type Message } from '@/lib/api/messages';
import { supabase } from '@/lib/supabase';

export function useRealtimeMessages(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await messagesApi.getByGroup(groupId);
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { data } = await messagesApi.getByGroup(groupId, nextCursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [groupId, nextCursor, isLoadingMore]);

  useEffect(() => {
    loadInitial();

    // Firebase RTDB listener — triggers for every new message written to groups/{groupId}/messages
    const db = getFirebaseDatabase();
    let unsubRTDB: (() => void) | undefined;
    if (db) {
      const startAt = Date.now();
      const msgsRef = ref(db, `groups/${groupId}/messages`);
      const newMsgsQuery = query(msgsRef, orderByChild('at'), startAfter(startAt));
      unsubRTDB = onChildAdded(newMsgsQuery, (snapshot) => {
        const val = snapshot.val() as Message | null;
        if (!val?.id) return;
        addMessage(val);
      });
    }

    // Supabase — keeps UPDATE (edits/deletes) in sync
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated['id']
                ? {
                    ...m,
                    content: updated['content'] as string,
                    editedAt: (updated['edited_at'] as string | null) ?? null,
                    deletedAt: (updated['deleted_at'] as string | null) ?? null,
                  }
                : m,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      unsubRTDB?.();
      supabase.removeChannel(channel);
    };
  }, [groupId, loadInitial, addMessage]);

  return { messages, isLoading, loadMore, isLoadingMore, hasMore: !!nextCursor };
}
