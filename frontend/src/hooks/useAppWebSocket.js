import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';

export const useAppWebSocket = () => {
  const wsRef = useRef(null);
  const { setWsConnected, updateEventPool, resolveEvent, updateDaoVote } = useAppStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let reconnectTimer;
    
    const connect = () => {
      const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8083/api')
        .replace(/^http/, 'ws') + '/ws';
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'bet_placed' && data.payload) {
            updateEventPool(data.payload.event_id, data.payload.option, data.payload.amount);
            queryClient.invalidateQueries({ queryKey: ['activeBets'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          } else if (data.type === 'bet_resolved' && data.payload) {
            resolveEvent(data.payload.event_id, data.payload.winning_option);
            queryClient.invalidateQueries({ queryKey: ['activeBets'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          }
          
          if (data.type === 'dao_vote' && data.payload) {
            updateDaoVote(data.payload.proposal_id, data.payload.vote_type);
            queryClient.invalidateQueries({ queryKey: ['daoProposals'] });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          }

          if (data.type === 'balance_updated' || data.type === 'payment_received') {
             queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          }
          
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, [setWsConnected, updateEventPool, resolveEvent, updateDaoVote, queryClient]);

  return { wsConnected: useAppStore((state) => state.wsConnected) };
};
