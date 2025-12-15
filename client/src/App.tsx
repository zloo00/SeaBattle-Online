import { useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { PlacementModal } from "./components/PlacementModal";
import GamePage from "./pages/Game";
import LobbyPage from "./pages/Lobby";

const Home = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [placementOpen, setPlacementOpen] = useState(false);
  const [roomId, setRoomId] = useState("");

  return (
    <div className="page">
      <div className="card wide-card">
        <div className="hero-row">
          <div>
            <h1 className="title">SeaBattle Online</h1>
            <p className="subtitle">
              Реальное время, комнаты 1 на 1, чат и туры. Начни с регистрации или входа.
            </p>
          </div>
          <div className="badge">10x10</div>
        </div>

        {user ? (
          <div className="placement-shell">
            <div className="pill info-pill">
              <span>Привет, {user.username}</span>
              <span className="muted">Аккаунт: {user.email}</span>
            </div>

            <div className="placement-bar">
              <div className="bar-text">
                <div className="eyebrow">ID комнаты</div>
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Вставь ID комнаты, к которой присоединился"
                />
                <div className="muted">
                  Нужен, чтобы сохранить свою расстановку и продолжить игру позже.
                </div>
              </div>
              <div className="bar-actions">
                <button type="button" onClick={() => setPlacementOpen(true)}>
                  Расставить корабли
                </button>
                <Link to="/lobby">
                  <button type="button" className="ghost">
                    ?????
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => navigate(roomId ? `/game/${roomId}` : "/game")}
                  className="ghost"
                >
                  Открыть чат комнаты
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px" }}>
            <Link to="/login">
              <button type="button">Войти</button>
            </Link>
            <Link to="/register">
              <button type="button">Регистрация</button>
            </Link>
          </div>
        )}
      </div>

      <PlacementModal
        open={placementOpen}
        roomId={roomId}
        onRoomIdChange={setRoomId}
        onClose={() => setPlacementOpen(false)}
      />
    </div>
  );
};

const AuthRedirect = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  if (user && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRedirect>
            <RegisterPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/game/:roomId?"
        element={
          <RequireAuth>
            <GamePage />
          </RequireAuth>
        }
      />
      <Route
        path="/lobby"
        element={
          <RequireAuth>
            <LobbyPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
