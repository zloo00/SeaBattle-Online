import { create } from 'zustand';
import { GameRoom, Ship, Shot } from '../types';

interface RoomState {
  room: GameRoom | null;
  shots: Shot[];
  myShips: Ship[];
  setRoom: (room: GameRoom | null) => void;
  setShots: (shots: Shot[]) => void;
  addShot: (shot: Shot) => void;
  setMyShips: (ships: Ship[]) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  shots: [],
  myShips: [],
  setRoom: (room) => set({ room }),
  setShots: (shots) => set({ shots }),
  addShot: (shot) =>
    set((state) => {
      const exists = state.shots.some((item) => item.id === shot.id);
      return exists ? state : { shots: [...state.shots, shot] };
    }),
  setMyShips: (myShips) => set({ myShips }),
  reset: () => set({ room: null, shots: [], myShips: [] }),
}));
