import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // WebSocket State
  wsConnected: false,
  setWsConnected: (status) => set({ wsConnected: status }),

  // Shared Data State
  leaderboardPlayers: [],
  leaderboardSquads: [],
  leaderboardTippers: [],
  setLeaderboardPlayers: (players) => set({ leaderboardPlayers: players }),
  setLeaderboardSquads: (squads) => set({ leaderboardSquads: squads }),
  setLeaderboardTippers: (tippers) => set({ leaderboardTippers: tippers }),

  // Real-time Event Data
  events: [],
  setEvents: (events) => set({ events }),
  updateEventPool: (eventId, option, amount) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id === eventId) {
          if (option === 'A') return { ...e, pool_a: e.pool_a + amount };
          if (option === 'B') return { ...e, pool_b: e.pool_b + amount };
        }
        return e;
      }),
    })),
  resolveEvent: (eventId, winningOption) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id === eventId) {
          return { ...e, status: 'resolved', winning_option: winningOption };
        }
        return e;
      })
    })),

  // DAO Proposals
  daoProposals: [],
  setDaoProposals: (proposals) => set({ daoProposals: proposals }),
  updateDaoVote: (proposalId, voteType) =>
    set((state) => ({
      daoProposals: state.daoProposals.map((p) => {
        if (p.id === proposalId) {
          if (voteType === 'up') return { ...p, votes_up: p.votes_up + 1 };
          if (voteType === 'down') return { ...p, votes_down: p.votes_down + 1 };
        }
        return p;
      }),
    })),
}));
