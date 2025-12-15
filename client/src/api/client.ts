import { AuthPayload, GameRoom, Message, PlaceShipsInput, Ship, Shot } from '../types';
import { useAuthStore } from '../store/auth';
import { createClient } from 'graphql-ws';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/graphql';
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (API_URL.startsWith('https')
    ? API_URL.replace('https', 'wss')
    : API_URL.replace('http', 'ws'));

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export const graphqlRequest = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const token = useAuthStore.getState().token;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!json.data) {
    throw new Error('No data returned');
  }
  return json.data;
};

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        wins
        losses
        gamesPlayed
        avatarUrl
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        email
        wins
        losses
        gamesPlayed
        avatarUrl
      }
    }
  }
`;

const PLACE_SHIPS_MUTATION = `
  mutation PlaceShips($input: PlaceShipsInput!) {
    placeShips(input: $input) {
      id
      playerId
      roomId
      startX
      startY
      length
      orientation
      hits
    }
  }
`;

const MY_SHIPS_QUERY = `
  query MyShips($roomId: ID!) {
    myShips(roomId: $roomId) {
      id
      playerId
      roomId
      startX
      startY
      length
      orientation
      hits
    }
  }
`;

const MESSAGES_QUERY = `
  query Messages($roomId: ID!) {
    messages(roomId: $roomId) {
      id
      roomId
      userId
      username
      text
      timestamp
      createdAt
      updatedAt
    }
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      roomId
      userId
      username
      text
      timestamp
      createdAt
      updatedAt
    }
  }
`;

const MESSAGE_ADDED_SUBSCRIPTION = `
  subscription OnMessageAdded($roomId: ID!) {
    messageAdded(roomId: $roomId) {
      id
      roomId
      userId
      username
      text
      timestamp
      createdAt
      updatedAt
    }
  }
`;

const ROOM_FIELDS = `
  id
  name
  status
  maxPlayers
  currentTurn
  winner
  participants
  isDeleted
  createdAt
  updatedAt
`;

const SHOT_FIELDS = `
  id
  playerId
  roomId
  x
  y
  result
  timestamp
  createdAt
  updatedAt
`;

const GET_PUBLIC_ROOMS_QUERY = `
  query GetPublicRooms {
    getPublicRooms {
      ${ROOM_FIELDS}
    }
  }
`;

const SEARCH_ROOMS_QUERY = `
  query SearchRooms($term: String!) {
    searchRooms(term: $term) {
      ${ROOM_FIELDS}
    }
  }
`;

const GET_MY_ROOMS_QUERY = `
  query GetMyRooms {
    getMyRooms {
      ${ROOM_FIELDS}
    }
  }
`;

const CREATE_ROOM_MUTATION = `
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      ${ROOM_FIELDS}
    }
  }
`;

const JOIN_ROOM_MUTATION = `
  mutation JoinRoom($input: JoinRoomInput!) {
    joinRoom(input: $input) {
      ${ROOM_FIELDS}
    }
  }
`;

const LEAVE_ROOM_MUTATION = `
  mutation LeaveRoom($input: LeaveRoomInput!) {
    leaveRoom(input: $input) {
      ${ROOM_FIELDS}
    }
  }
`;

const GET_ROOM_QUERY = `
  query Room($id: ID!) {
    room(id: $id) {
      ${ROOM_FIELDS}
    }
  }
`;

const SHOTS_QUERY = `
  query Shots($roomId: ID!) {
    shots(roomId: $roomId) {
      ${SHOT_FIELDS}
    }
  }
`;

const MAKE_SHOT_MUTATION = `
  mutation MakeShot($input: MakeShotInput!) {
    makeShot(input: $input) {
      ${SHOT_FIELDS}
    }
  }
`;

const SHOT_FIRED_SUBSCRIPTION = `
  subscription OnShotFired($roomId: ID!) {
    shotFired(roomId: $roomId) {
      ${SHOT_FIELDS}
    }
  }
`;

export const register = (input: {
  username: string;
  email: string;
  password: string;
}) => graphqlRequest<{ register: AuthPayload }>(REGISTER_MUTATION, { input });

export const login = (input: { email: string; password: string }) =>
  graphqlRequest<{ login: AuthPayload }>(LOGIN_MUTATION, { input });

export const placeShips = (input: PlaceShipsInput) =>
  graphqlRequest<{ placeShips: Ship[] }>(PLACE_SHIPS_MUTATION, { input });

export const getMyShips = (roomId: string) =>
  graphqlRequest<{ myShips: Ship[] }>(MY_SHIPS_QUERY, { roomId });

export const getMessages = (roomId: string) =>
  graphqlRequest<{ messages: Message[] }>(MESSAGES_QUERY, { roomId });

export const sendMessage = (input: { roomId: string; text: string }) =>
  graphqlRequest<{ sendMessage: Message }>(SEND_MESSAGE_MUTATION, { input });

export const getPublicRooms = () =>
  graphqlRequest<{ getPublicRooms: GameRoom[] }>(GET_PUBLIC_ROOMS_QUERY);

export const searchRooms = (term: string) =>
  graphqlRequest<{ searchRooms: GameRoom[] }>(SEARCH_ROOMS_QUERY, { term });

export const getMyRooms = () =>
  graphqlRequest<{ getMyRooms: GameRoom[] }>(GET_MY_ROOMS_QUERY);

export const createRoom = (input: { name: string; password?: string }) =>
  graphqlRequest<{ createRoom: GameRoom }>(CREATE_ROOM_MUTATION, { input });

export const joinRoom = (input: { roomId: string; password?: string }) =>
  graphqlRequest<{ joinRoom: GameRoom }>(JOIN_ROOM_MUTATION, { input });

export const leaveRoom = (roomId: string) =>
  graphqlRequest<{ leaveRoom: GameRoom }>(LEAVE_ROOM_MUTATION, {
    input: { roomId },
  });

export const getRoom = (id: string) =>
  graphqlRequest<{ room: GameRoom | null }>(GET_ROOM_QUERY, { id });

export const getShots = (roomId: string) =>
  graphqlRequest<{ shots: Shot[] }>(SHOTS_QUERY, { roomId });

export const makeShot = (input: { roomId: string; x: number; y: number }) =>
  graphqlRequest<{ makeShot: Shot }>(MAKE_SHOT_MUTATION, { input });

type SubscriptionCallbacks<T> = {
  onData: (data: T) => void;
  onError?: (err: unknown) => void;
  onComplete?: () => void;
};

let wsClient: ReturnType<typeof createClient> | null = null;

const getWsClient = () => {
  if (wsClient) return wsClient;
  wsClient = createClient({
    url: WS_URL,
    connectionParams: () => {
      const token = useAuthStore.getState().token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
  return wsClient;
};

export const subscribeToMessages = (
  roomId: string,
  { onData, onError, onComplete }: SubscriptionCallbacks<Message>
) => {
  const client = getWsClient();
  const dispose = client.subscribe(
    {
      query: MESSAGE_ADDED_SUBSCRIPTION,
      variables: { roomId },
    },
    {
      next: (value) => {
        const payload = value.data as { messageAdded?: Message } | undefined;
        if (payload?.messageAdded) {
          onData(payload.messageAdded);
        }
      },
      error: (err) => onError?.(err),
      complete: () => onComplete?.(),
    }
  );

  return dispose;
};

export const subscribeToShots = (
  roomId: string,
  { onData, onError, onComplete }: SubscriptionCallbacks<Shot>
) => {
  const client = getWsClient();
  const dispose = client.subscribe(
    {
      query: SHOT_FIRED_SUBSCRIPTION,
      variables: { roomId },
    },
    {
      next: (value) => {
        const payload = value.data as { shotFired?: Shot } | undefined;
        if (payload?.shotFired) {
          onData(payload.shotFired);
        }
      },
      error: (err) => onError?.(err),
      complete: () => onComplete?.(),
    }
  );

  return dispose;
};
