import { useAuthStore } from '../store/auth';
import { createClient } from 'graphql-ws';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/graphql';
const WS_URL = import.meta.env.VITE_WS_URL ||
    (API_URL.startsWith('https')
        ? API_URL.replace('https', 'wss')
        : API_URL.replace('http', 'ws'));
export const graphqlRequest = async (query, variables) => {
    const token = useAuthStore.getState().token;
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json());
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
export const register = (input) => graphqlRequest(REGISTER_MUTATION, { input });
export const login = (input) => graphqlRequest(LOGIN_MUTATION, { input });
export const placeShips = (input) => graphqlRequest(PLACE_SHIPS_MUTATION, { input });
export const getMyShips = (roomId) => graphqlRequest(MY_SHIPS_QUERY, { roomId });
export const getMessages = (roomId) => graphqlRequest(MESSAGES_QUERY, { roomId });
export const sendMessage = (input) => graphqlRequest(SEND_MESSAGE_MUTATION, { input });
export const getPublicRooms = () => graphqlRequest(GET_PUBLIC_ROOMS_QUERY);
export const searchRooms = (term) => graphqlRequest(SEARCH_ROOMS_QUERY, { term });
export const getMyRooms = () => graphqlRequest(GET_MY_ROOMS_QUERY);
export const createRoom = (input) => graphqlRequest(CREATE_ROOM_MUTATION, { input });
export const joinRoom = (input) => graphqlRequest(JOIN_ROOM_MUTATION, { input });
export const leaveRoom = (roomId) => graphqlRequest(LEAVE_ROOM_MUTATION, {
    input: { roomId },
});
let wsClient = null;
const getWsClient = () => {
    if (wsClient)
        return wsClient;
    wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
            const token = useAuthStore.getState().token;
            return token ? { Authorization: `Bearer ${token}` } : {};
        },
    });
    return wsClient;
};
export const subscribeToMessages = (roomId, { onData, onError, onComplete }) => {
    const client = getWsClient();
    const dispose = client.subscribe({
        query: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { roomId },
    }, {
        next: (value) => {
            const payload = value.data;
            if (payload?.messageAdded) {
                onData(payload.messageAdded);
            }
        },
        error: (err) => onError?.(err),
        complete: () => onComplete?.(),
    });
    return dispose;
};
