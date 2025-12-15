export interface AuthUser {
  id: string;
  username: string;
  email: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  avatarUrl?: string | null;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
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
