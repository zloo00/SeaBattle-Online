import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, getMyRooms } from "../api/client";
import { GameRoom } from "../types";
import { useAuthStore } from "../store/auth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [finishedRooms, setFinishedRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [{ me }, { getMyRooms: rooms }] = await Promise.all([getMe(), getMyRooms()]);
      if (me) {
        setUser(me);
      }
      setActiveRooms(rooms.filter((room) => room.status !== "finished"));
      setFinishedRooms(rooms.filter((room) => room.status === "finished"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Не удалось обновить профиль");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Профиль</h1>
          <p className="subtitle">Чтобы увидеть статистику, войдите в систему.</p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link to="/login">
              <button type="button">Войти</button>
            </Link>
            <Link to="/register">
              <button type="button" className="ghost">
                Регистрация
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderRoom = (room: GameRoom) => (
    <div key={room.id} className="room-card">
      <div>
        <div className="room-name">{room.name}</div>
        <div className="muted">
          ID: {room.id.slice(0, 6)}… • Статус: {room.status} • Игроки:{" "}
          {room.participants.length}/{room.maxPlayers}
        </div>
      </div>
      <div className="room-actions">
        <button type="button" onClick={() => navigate(`/room/${room.id}`)}>
          Открыть
        </button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="card wide-card">
        <div className="hero-row">
          <div>
            <h1 className="title">Профиль</h1>
            <p className="subtitle">
              Статистика игрока, активные и завершённые комнаты. Обновляйте, чтобы подтянуть свежие
              данные.
            </p>
          </div>
          <div className="pill">ID: {user.id.slice(0, 6)}…</div>
        </div>

        <div className="lobby-grid">
          <div className="panel-card">
            <h3 className="panel-title">Аккаунт</h3>
            <div className="pill info-pill">
              <span>{user.username}</span>
              <span className="muted">{user.email}</span>
            </div>
            <div className="muted">
              Создан: {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
            </div>
            <div className="muted">
              Обновлён: {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
            </div>
            <button type="button" onClick={loadProfile} disabled={loading}>
              {loading ? "Обновляем..." : "Обновить"}
            </button>
          </div>

          <div className="panel-card">
            <h3 className="panel-title">Статистика</h3>
            <div className="stats-row">
              <div className="stat">
                <div className="stat-value">{user.gamesPlayed}</div>
                <div className="muted">Игр всего</div>
              </div>
              <div className="stat">
                <div className="stat-value">{user.wins}</div>
                <div className="muted">Побед</div>
              </div>
              <div className="stat">
                <div className="stat-value">{user.losses}</div>
                <div className="muted">Поражений</div>
              </div>
            </div>
            <div className="bar-actions" style={{ marginTop: "8px" }}>
              <Link to="/lobby">
                <button type="button" className="ghost">
                  В лобби
                </button>
              </Link>
              <Link to="/">
                <button type="button" className="ghost">
                  На главную
                </button>
              </Link>
            </div>
          </div>
        </div>

        {status && <div className="status">{status}</div>}

        <section className="panel-card">
          <div className="panel-title">Активные комнаты</div>
          {activeRooms.length === 0 && <div className="muted">Нет активных комнат.</div>}
          <div className="room-list">{activeRooms.map(renderRoom)}</div>
        </section>

        <section className="panel-card">
          <div className="panel-title">Завершённые комнаты</div>
          {finishedRooms.length === 0 && (
            <div className="muted">Завершённых комнат пока нет.</div>
          )}
          <div className="room-list">{finishedRooms.map(renderRoom)}</div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
