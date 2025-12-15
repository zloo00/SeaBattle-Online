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
