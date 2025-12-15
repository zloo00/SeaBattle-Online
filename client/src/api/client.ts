import { AuthPayload } from "../types";
import { useAuthStore } from "../store/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!json.data) {
    throw new Error("No data returned");
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

export const register = (input: { username: string; email: string; password: string }) =>
  graphqlRequest<{ register: AuthPayload }>(REGISTER_MUTATION, { input });

export const login = (input: { email: string; password: string }) =>
  graphqlRequest<{ login: AuthPayload }>(LOGIN_MUTATION, { input });
