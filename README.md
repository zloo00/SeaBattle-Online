# SeaBattle Online

SeaBattle Online is a full-stack multiplayer Battleship experience built with a React/Vite client and a Node.js GraphQL API. Players can register, log in, arrange the standard 10x10 fleet, chat with opponents in real time, and sync their ship layouts via GraphQL mutations and subscriptions backed by MongoDB.

## Highlights
- **End-to-end TypeScript** across client and server for safer refactors.
- **GraphQL API** (Apollo Server + Express) exposes auth, ship placement, and chat messaging backed by MongoDB models.
- **Real-time chat** delivered via `graphql-ws` subscriptions and persisted per room.
- **Fleet builder UI** with validation, auto-placement, and persistence of the canonical Battleship ship mix.
- **Stateful UX** using Zustand for auth storage, React Hook Form + Zod for validation, and WebSocket fallbacks that reuse the same auth token.

## Architecture Overview
| Layer  | Tech | Notes |
| --- | --- | --- |
| Client (`client/`) | React 18, Vite 5, Zustand, React Router, GraphQL fetch layer | Handles routing, auth, ship placement modal, chat UI, subscriptions via `graphql-ws`. |
| Server (`server/`) | Express, Apollo Server 3, MongoDB (Mongoose), JWT, Zod | Provides GraphQL schema for auth, ships, chat; enforces validation and authorization guards. |
| Realtime | `graphql-ws`, `ws`, Apollo subscriptions | Same `/graphql` endpoint handles HTTP queries/mutations and WebSocket subscriptions. |

### Key directories
```
client/
  src/api        GraphQL operations + websocket client
  src/components Fleet placement modal + helpers
  src/pages      Auth screens, chat/game view
  src/store      Zustand auth persistence
server/
  src/auth       JWT + password helpers + auth guard
  src/config     Env loader + Mongo connection
  src/graphql    TypeDefs, resolvers, context, pubsub
  src/models     Mongoose models (User, GameRoom, Ship, Shot, Message)
  src/validation Zod schemas + fleet validation
```

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB 6+ running locally or accessible via URI

## Setup
1. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. **Configure environment**
   - Copy `.env.example` (root) to `.env` and adjust values.
   - For the server you can also copy `server/.env.example` to `server/.env` if you prefer per-package env files.
3. **Start development servers**
   ```bash
   # Terminal 1 - GraphQL API
   cd server
   npm run dev

   # Terminal 2 - Vite dev server
   cd client
   npm run dev
   ```
   - API defaults to `http://localhost:4000/graphql`.
   - Vite dev server defaults to `http://localhost:5173/` and proxies calls directly to the GraphQL endpoint defined in `VITE_API_URL`.

### Docker Compose
- Build and run all services (MongoDB + API + client):
  ```bash
  docker-compose up --build
  ```
- Server is exposed on `http://localhost:4000/graphql` with `/health` for healthchecks.
- Client is served on `http://localhost:5173/` (env values from `.env` are baked into the build).

## Environment Variables
Root `.env` (see `.env.example`) covers both sides:

```
# Server
PORT=4000
MONGODB_URI=mongodb://localhost:27017/seabattle
JWT_SECRET=replace-me

# Client
VITE_API_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:4000/graphql
```

- `PORT` must match what the client expects.
- `VITE_WS_URL` should be `ws://`/`wss://` version of the API URL for subscriptions.

## Seeding demo data
- Seeds two users (`alice@example.com` / `bob@example.com`, password `password123`), one demo room, fleets for обоих игроков и пару сообщений.
- Run from `server/`:
  ```bash
  npm run seed
  ```
- После сидирования войдите под любым из аккаунтов и откройте комнату с ID, который выводится в конце скрипта.

## npm Scripts
| Location | Script | Description |
| --- | --- | --- |
| `server` | `npm run dev` | Start API with `ts-node-dev`, auto-reloading on changes. |
|  | `npm run build` | Emit compiled JS to `dist/`. |
|  | `npm start` | Run compiled build. |
|  | `npm run lint` | ESLint against `.ts` sources. |
|  | `npm run seed` | Seed demo users/rooms/ships/messages. |
| `client` | `npm run dev` | Launch Vite dev server with hot reloading. |
|  | `npm run build` | Type-check + build production assets. |
|  | `npm run preview` | Preview built client locally. |

## GraphQL Surface Area
| Operation | Purpose |
| --- | --- |
| `mutation register(input: RegisterInput!)` | Create account and receive JWT. |
| `mutation login(input: LoginInput!)` | Authenticate existing user. |
| `query me` | Fetch current user profile. |
| `query myShips(roomId: ID!)` | Read authenticated player ship layout for a room. |
| `mutation placeShips(input: PlaceShipsInput!)` | Persist fleet layout after validation. |
| `query messages(roomId: ID!)` | Fetch last 100 chat messages in a room. |
| `mutation sendMessage(input: SendMessageInput!)` | Send a chat message to a room. |
| `subscription messageAdded(roomId: ID!)` | Receive live chat updates for the room a user belongs to. |

Authorization is enforced via the `Authorization: Bearer <JWT>` header. Attempts to access rooms the user does not participate in will fail.

## Postman Collection
- Import `docs/postman/SeaBattle.postman_collection.json` to get ready-to-run GraphQL requests for every mutation/query above.
- The collection defines `baseUrl`, `authToken`, and `roomId` variables. After calling **Auth - Login** (or Register) copy the returned JWT into the `authToken` variable and reuse it for the rest of the requests.
- For subscriptions, Postman does not currently support the `graphql-ws` protocol; use a WebSocket client such as GraphQL Playground or GraphiQL for `messageAdded`.

## Development Notes
- The server enforces ship placement rules in `server/src/validation/shipValidation.ts`, so even if the UI is bypassed invalid layouts are rejected.
- Messages and ships are scoped per `roomId` and require membership. Ensure you seed at least one `GameRoom` document manually or via Mongo shell while the project is in early stages.
- `ts-node-dev` reloads on file saves; if you add new environment variables restart the dev server to pick them up.
- Stats (`wins`, `losses`, `gamesPlayed`) обновляются сервером при завершении партии (`makeShot`), профиль `/profile` подтягивает актуальные значения через `me`.

## Troubleshooting
- If the client displays garbled placeholder copy, ensure your terminal/editor is using UTF-8. The source files intentionally keep localized placeholder strings.
- WebSocket errors typically mean `VITE_WS_URL` does not match your API host or a token is missing/expired.
- Mongo connection failures usually stem from `MONGODB_URI` typos or the local daemon not running; check `mongod` logs.

## Realtime Testing
1. Start both `server` (`npm run dev`) and `client` (`npm run dev`) projects.
2. Open two separate browsers (or one normal window + one incognito) and log in with different accounts.
3. From the lobby, create/join the same room. Each screen will subscribe to:
   - `messageAdded` for chat
   - `shotFired` for board updates (client shows optimistic markers immediately)
   - `roomUpdated` for turn/status changes
4. Send a chat message or fire a shot in one browser — the other browser should reflect the change instantly.
5. Watch the optimistic shot markers: the firing player sees `?` on the target cell immediately, which is replaced by the actual result as soon as the subscription payload arrives.

## Вклад (по фичам)
- **Студент A**: серверная аутентификация (JWT), правила размещения флота, PubSub/roomUpdated, сидинг данных, подсчёт win/loss.  
- **Студент B**: клиентские экраны (лобби/игра/профиль), Zustand-сторы, подписки на выстрелы и чат, React Hook Form + Zod для auth форм.
