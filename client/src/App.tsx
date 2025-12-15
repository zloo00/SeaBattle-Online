import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";

const Home = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">SeaBattle Online</h1>
        <p className="subtitle">
          Реальное время, комнаты 1 на 1, чат и туры. Начни с регистрации или входа.
        </p>
        {user ? (
          <>
            <p>Привет, {user.username}! Ты вошел как {user.email}.</p>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Выйти
            </button>
          </>
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
    </Routes>
  );
}

export default App;
