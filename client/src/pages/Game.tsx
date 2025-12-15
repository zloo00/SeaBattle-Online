import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getMessages,
  getRoom,
  getShots,
  makeShot,
  sendMessage,
  subscribeToMessages,
  subscribeToShots,
  subscribeToRoomUpdates,
} from '../api/client';
import { GameRoom, Message, Shot } from '../types';
import { useAuthStore } from '../store/auth';
import { useSubscription } from '../hooks/useSubscription';

const BOARD_SIZE = 10;
const cellKey = (x: number, y: number) => `${x}-${y}`;

const GamePage = () => {
  const { roomId: routeRoomId } = useParams();
  const [roomId, setRoomId] = useState(routeRoomId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [shots, setShots] = useState<Shot[]>([]);
  const [shotsLoading, setShotsLoading] = useState(false);
  const [battleStatus, setBattleStatus] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(false);
  const [roomState, setRoomState] = useState<GameRoom | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [optimisticShots, setOptimisticShots] = useState<{ x: number; y: number }[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((s) => s.user);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [messages]
  );

  const playerShots = useMemo(
    () => shots.filter((shot) => shot.playerId === user?.id),
    [shots, user?.id]
  );
  const opponentShots = useMemo(
    () => shots.filter((shot) => shot.playerId !== user?.id),
    [shots, user?.id]
  );

  const playerShotMap = useMemo(() => {
    const map = new Map<string, Shot>();
    playerShots.forEach((shot) => map.set(cellKey(shot.x, shot.y), shot));
    return map;
  }, [playerShots]);

  const opponentShotMap = useMemo(() => {
    const map = new Map<string, Shot>();
    opponentShots.forEach((shot) => map.set(cellKey(shot.x, shot.y), shot));
    return map;
  }, [opponentShots]);

  const optimisticShotSet = useMemo(() => {
    const set = new Set<string>();
    optimisticShots.forEach((cell) => set.add(cellKey(cell.x, cell.y)));
    return set;
  }, [optimisticShots]);

  const canShoot =
    !!user &&
    !!roomState &&
    roomState.status === 'playing' &&
    roomState.currentTurn === user.id;

  const turnLabel = useMemo(() => {
    if (!roomState || !user) {
      return 'Нет информации о комнате';
    }
    if (roomState.status === 'finished') {
      if (roomState.winner === user.id) {
        return 'Игра завершена — вы победили!';
      }
      if (roomState.winner) {
        return 'Игра завершена — победил соперник.';
      }
      return 'Игра завершена.';
    }
    if (roomState.participants.length < 2) {
      return 'Ожидание соперника...';
    }
    return roomState.currentTurn === user.id ? 'Ваш ход' : 'Ход соперника';
  }, [roomState, user]);

  const fetchShots = useCallback(async () => {
    if (!roomId.trim()) {
      setShots([]);
      return;
    }
    setShotsLoading(true);
    try {
      const { shots: list } = await getShots(roomId.trim());
      setShots(list);
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось загрузить историю выстрелов'
      );
    } finally {
      setShotsLoading(false);
    }
  }, [roomId]);

  const fetchRoomState = useCallback(async () => {
    if (!roomId.trim()) {
      setRoomState(null);
      return;
    }
    setRoomLoading(true);
    try {
      const { room } = await getRoom(roomId.trim());
      setRoomState(room ?? null);
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось обновить состояние комнаты'
      );
    } finally {
      setRoomLoading(false);
    }
  }, [roomId]);

  const clearOptimisticShot = useCallback((x: number, y: number) => {
    setOptimisticShots((prev) =>
      prev.filter((cell) => cell.x !== x || cell.y !== y)
    );
  }, []);

  useEffect(() => {
    setChatStatus(null);
    if (!roomId.trim()) {
      setMessages([]);
      return;
    }
    setChatLoading(true);
    getMessages(roomId.trim())
      .then(({ messages: list }) => setMessages(list))
      .catch((err) =>
        setChatStatus(
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить сообщения комнаты'
        )
      )
      .finally(() => setChatLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId.trim()) {
      setShots([]);
      setRoomState(null);
      return;
    }
    fetchShots();
    fetchRoomState();
  }, [roomId, fetchShots, fetchRoomState]);

  useSubscription(
    () =>
      subscribeToMessages(roomId.trim(), {
        onData: (message) =>
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === message.id);
            return exists ? prev : [...prev, message];
          }),
        onError: (err) =>
          setChatStatus(
            err instanceof Error
              ? err.message
              : 'Ошибка подписки на сообщения. Обновите страницу.'
          ),
      }),
    [roomId],
    Boolean(roomId.trim())
  );

  useSubscription(
    () =>
      subscribeToShots(roomId.trim(), {
        onData: (shot) => {
          setShots((prev) => {
            const exists = prev.some((item) => item.id === shot.id);
            return exists ? prev : [...prev, shot];
          });
          if (shot.playerId === user?.id) {
            clearOptimisticShot(shot.x, shot.y);
          }
        },
        onError: (err) =>
          setBattleStatus(
            err instanceof Error
              ? err.message
              : 'Ошибка подписки на выстрелы. Попробуйте перезайти в комнату.'
          ),
      }),
    [roomId, user?.id, clearOptimisticShot],
    Boolean(roomId.trim())
  );

  useSubscription(
    () =>
      subscribeToRoomUpdates(roomId.trim(), {
        onData: (room) => setRoomState(room),
        onError: (err) =>
          setBattleStatus(
            err instanceof Error
              ? err.message
              : 'Ошибка подписки на состояние комнаты.'
          ),
      }),
    [roomId],
    Boolean(roomId.trim())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sortedMessages.length]);

  const handleSend = async () => {
    if (!roomId.trim() || !chatInput.trim()) {
      setChatStatus('Укажите комнату и введите сообщение.');
      return;
    }
    setChatStatus(null);
    const text = chatInput.trim();
    setChatInput('');
    try {
      const { sendMessage: message } = await sendMessage({
        roomId: roomId.trim(),
        text,
      });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setChatStatus(
        err instanceof Error ? err.message : 'Не удалось отправить сообщение'
      );
    }
  };

  const handleShot = async (x: number, y: number) => {
    if (!roomId.trim()) {
      setBattleStatus('Укажите ID комнаты перед выстрелом');
      return;
    }
    if (!canShoot) {
      setBattleStatus('Сейчас не ваш ход');
      return;
    }
    if (playerShotMap.has(cellKey(x, y))) {
      setBattleStatus('Вы уже стреляли в эту клетку');
      return;
    }

    setShotLoading(true);
    setBattleStatus(null);
    setOptimisticShots((prev) => [...prev, { x, y }]);
    try {
      const { makeShot: shot } = await makeShot({ roomId: roomId.trim(), x, y });
      setShots((prev) => {
        const exists = prev.some((item) => item.id === shot.id);
        return exists ? prev : [...prev, shot];
      });
      if (shot.result === 'miss') {
        setBattleStatus('Выстрел мимо.');
      } else if (shot.result === 'hit') {
        setBattleStatus('Попадание!');
      } else {
        setBattleStatus('Корабль противника потоплен!');
      }
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось выполнить выстрел'
      );
    } finally {
      setShotLoading(false);
      clearOptimisticShot(x, y);
    }
  };

  const renderBoard = (
    title: string,
    shotMap: Map<string, Shot>,
    interactive: boolean
  ) => (
    <div className="panel-card">
      <div className="panel-title">{title}</div>
      <div
        className="board-grid battleship-grid"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((__, x) => {
            const shot = shotMap.get(cellKey(x, y));
            const pending = interactive && optimisticShotSet.has(cellKey(x, y));
            const statusClass = shot
              ? `shot-${shot.result}`
              : pending
                ? 'shot-pending'
                : '';
            return (
              <button
                key={cellKey(x, y)}
                type="button"
                className={`grid-cell shot-cell ${statusClass}`}
                disabled={!interactive || !!shot || shotLoading || pending}
                onClick={() => interactive && handleShot(x, y)}
              >
                {shot
                  ? shot.result === 'miss'
                    ? '•'
                    : shot.result === 'hit'
                      ? '✕'
                      : '☠'
                  : pending
                    ? '?'
                    : ''}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="card wide-card">
        <div className="hero-row">
          <div>
            <h1 className="title">Комната: {roomId || '—'}</h1>
            <p className="subtitle">
              Следите за чатом и ходом боя, делайте выстрелы по сетке 10x10.
            </p>
          </div>
          <div className="badge">10x10</div>
        </div>

        <div className="placement-bar chat-bar">
          <div className="bar-text">
            <div className="eyebrow">ID комнаты</div>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Вставьте ID комнаты"
            />
            <div className="muted">
              Вставьте ID комнаты или откройте игру из лобби, чтобы отправлять ходы.
            </div>
          </div>
          <div className="bar-actions">
            <div className="pill info-pill">
              {user?.username ?? 'Без авторизации'}
              <span className="muted">{turnLabel}</span>
            </div>
          </div>
        </div>

        {(roomLoading || shotsLoading) && (
          <div className="status">Обновляем состояние боя...</div>
        )}

        <div className="battle-grid">
          {renderBoard('Ваши выстрелы', playerShotMap, Boolean(canShoot))}
          {renderBoard('Выстрелы соперника', opponentShotMap, false)}
        </div>

        {battleStatus && <div className="status">{battleStatus}</div>}

        <div className="chat-shell">
          <div className="chat-feed" ref={scrollRef}>
            {chatLoading && <div className="muted">Загрузка сообщений...</div>}
            {!chatLoading && sortedMessages.length === 0 && (
              <div className="muted">Сообщений пока нет. Станьте первым!</div>
            )}
            {sortedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-item ${msg.userId === user?.id ? 'own' : ''}`}
              >
                <div className="chat-meta">
                  <span className="chat-author">{msg.username}</span>
                  <span className="muted">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Сообщение..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="button" onClick={handleSend} disabled={!roomId.trim()}>
              Отправить
            </button>
          </div>
          {chatStatus && <div className="status">{chatStatus}</div>}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
