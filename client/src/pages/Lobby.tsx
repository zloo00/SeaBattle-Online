import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createRoom,
  getMyRooms,
  getPublicRooms,
  joinRoom,
  leaveRoom,
  searchRooms,
} from '../api/client';
import { GameRoom } from '../types';

const LobbyPage = () => {
  const navigate = useNavigate();
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
  const [myRooms, setMyRooms] = useState<GameRoom[]>([]);
  const [searchResults, setSearchResults] = useState<GameRoom[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', password: '' });
  const [joinForm, setJoinForm] = useState({ roomId: '', password: '' });

  const roomsToShow = useMemo(
    () => (searchResults ? searchResults : publicRooms),
    [publicRooms, searchResults]
  );

  const loadRooms = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [publicRes, myRes] = await Promise.all([getPublicRooms(), getMyRooms()]);
      setPublicRooms(publicRes.getPublicRooms);
      setMyRooms(myRes.getMyRooms);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось загрузить комнаты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setStatus(null);
    try {
      const result = await searchRooms(term);
      setSearchResults(result.searchRooms);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось выполнить поиск');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      setStatus('Введите название комнаты');
      return;
    }
    setStatus(null);
    try {
      const result = await createRoom({
        name: createForm.name.trim(),
        password: createForm.password.trim() || undefined,
      });
      setCreateForm({ name: '', password: '' });
      setJoinForm((prev) => ({ ...prev, roomId: result.createRoom.id }));
      await loadRooms();
      setSearchResults(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось создать комнату');
    }
  };

  const handleJoinRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!joinForm.roomId.trim()) {
      setStatus('Укажите ID комнаты');
      return;
    }
    setStatus(null);
    try {
      const result = await joinRoom({
        roomId: joinForm.roomId.trim(),
        password: joinForm.password.trim() || undefined,
      });
      await loadRooms();
      navigate(`/room/${result.joinRoom.id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось присоединиться к комнате');
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    setStatus(null);
    try {
      await leaveRoom(roomId);
      await loadRooms();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Не удалось покинуть комнату');
    }
  };

  const handlePrefillJoin = (roomId: string) => {
    setJoinForm((prev) => ({ ...prev, roomId }));
  };

  const occupancy = (room: GameRoom) => `${room.participants.length}/${room.maxPlayers}`;

  return (
    <div className="page">
      <div className="card wide-card">
        <div className="hero-row">
          <div>
            <h1 className="title">Лобби</h1>
            <p className="subtitle">
              Просматривайте список комнат, создавайте свои и присоединяйтесь к уже существующим.
            </p>
          </div>
          <Link to="/" className="pill ghost" style={{ textDecoration: 'none' }}>
            ← На главную
          </Link>
        </div>

        <div className="lobby-grid">
          <form className="panel-card" onSubmit={handleCreateRoom}>
            <h3 className="panel-title">Создать комнату</h3>
            <label>
              Название
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, 'Бой №1'"
              />
            </label>
            <label>
              Пароль (необязательно)
              <input
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Оставьте пустым для публичной комнаты"
              />
            </label>
            <button type="submit">Создать</button>
          </form>

          <form className="panel-card" onSubmit={handleJoinRoom}>
            <h3 className="panel-title">Присоединиться по ID</h3>
            <label>
              ID комнаты
              <input
                value={joinForm.roomId}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, roomId: e.target.value }))}
                placeholder="64ef...abc"
              />
            </label>
            <label>
              Пароль (если требуется)
              <input
                value={joinForm.password}
                onChange={(e) => setJoinForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>
            <button type="submit">Войти</button>
          </form>
        </div>

        <form className="panel-card" onSubmit={handleSearch}>
          <h3 className="panel-title">Поиск комнат</h3>
          <div className="placement-bar">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Введите название комнаты"
            />
            <div className="bar-actions">
              <button type="submit" disabled={searching}>
                {searching ? 'Поиск...' : 'Искать'}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults(null);
                }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </form>

        {status && <div className="status">{status}</div>}
        {loading && <div className="muted">Загрузка комнат...</div>}

        <section className="panel-card">
          <div className="panel-title">Мои комнаты</div>
          {myRooms.length === 0 && <div className="muted">Вы ещё не присоединились ни к одной комнате.</div>}
          <div className="room-list">
            {myRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div>
                  <div className="room-name">{room.name}</div>
                  <div className="muted">
                    Статус: {room.status} • Игроки: {occupancy(room)}
                  </div>
                </div>
                <div className="room-actions">
                  <button type="button" onClick={() => navigate(`/room/${room.id}`)}>
                    Перейти
                  </button>
                  <button type="button" className="ghost" onClick={() => handleLeaveRoom(room.id)}>
                    Покинуть
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-title">
            {searchResults ? 'Результаты поиска' : 'Публичные комнаты'}
          </div>
          {roomsToShow.length === 0 && (
            <div className="muted">
              {searchResults ? 'По вашему запросу ничего не найдено.' : 'Пока нет доступных комнат.'}
            </div>
          )}
          <div className="room-list">
            {roomsToShow.map((room) => (
              <div key={room.id} className="room-card">
                <div>
                  <div className="room-name">{room.name}</div>
                  <div className="muted">
                    ID: {room.id.slice(0, 6)}… • Игроки: {occupancy(room)} • Статус: {room.status}
                  </div>
                </div>
                <div className="room-actions">
                  <button type="button" onClick={() => handlePrefillJoin(room.id)}>
                    Использовать ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LobbyPage;
