export interface AuthUser {
  id: string;
  username: string;
  email: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export type GameRoomStatus = "waiting" | "placing" | "playing" | "finished";

export interface GameRoom {
  id: string;
  name: string;
  status: GameRoomStatus;
  maxPlayers: number;
  currentTurn: string | null;
  winner: string | null;
  participants: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ShotResult = "miss" | "hit" | "sunk";

export interface Shot {
  id: string;
  playerId: string;
  roomId: string;
  x: number;
  y: number;
  result: ShotResult;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export type ShipOrientation = "horizontal" | "vertical";

export interface ShipPlacement {
  startX: number;
  startY: number;
  length: number;
  orientation: ShipOrientation;
}

export interface Ship extends ShipPlacement {
  id: string;
  playerId: string;
  roomId: string;
  hits: number;
}

export interface PlaceShipsInput {
  roomId: string;
  ships: ShipPlacement[];
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
