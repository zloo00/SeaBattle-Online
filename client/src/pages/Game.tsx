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
  getMyShips,
} from '../api/client';
import { GameRoom, Message, Ship, Shot } from '../types';
import { useAuthStore } from '../store/auth';
import { useSubscription } from '../hooks/useSubscription';
import { useRoomStore } from '../store/room';

const BOARD_SIZE = 10;
const cellKey = (x: number, y: number) => `${x}-${y}`;

const expandShipCells = (ship: Ship) => {
  const dx = ship.orientation === 'horizontal' ? 1 : 0;
  const dy = ship.orientation === 'vertical' ? 1 : 0;
  return Array.from({ length: ship.length }, (_, idx) => ({
    x: ship.startX + dx * idx,
    y: ship.startY + dy * idx,
  }));
};

const GamePage = () => {
  const { roomId: routeRoomId } = useParams();
  const [roomId, setRoomId] = useState(routeRoomId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [shotsLoading, setShotsLoading] = useState(false);
  const [battleStatus, setBattleStatus] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [optimisticShots, setOptimisticShots] = useState<{ x: number; y: number }[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const { room, shots, setRoom, setShots, addShot, myShips, setMyShips, reset } =
    useRoomStore();

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

  const shipCells = useMemo(() => {
    const set = new Set<string>();
    myShips.forEach((ship) => {
      expandShipCells(ship).forEach((cell) => set.add(cellKey(cell.x, cell.y)));
    });
    return set;
  }, [myShips]);

  const optimisticShotSet = useMemo(() => {
    const set = new Set<string>();
    optimisticShots.forEach((cell) => set.add(cellKey(cell.x, cell.y)));
    return set;
  }, [optimisticShots]);

  const clearOptimisticShot = useCallback((x: number, y: number) => {
    setOptimisticShots((prev) => prev.filter((cell) => cell.x !== x || cell.y !== y));
  }, []);

  const canShoot =
    !!user && !!room && room.status === 'playing' && room.currentTurn === user.id;

  const turnLabel = useMemo(() => {
    if (!room || !user) {
      return 'Нет информации о комнате';
    }
    if (room.status === 'finished') {
      if (room.winner === user.id) {
        return 'Игра завершена — вы победили!';
      }
      if (room.winner) {
        return 'Игра завершена — победил соперник.';
      }
      return 'Игра завершена.';
    }
    if (room.participants.length < 2) {
      return 'Ожидание соперника...';
    }
    return room.currentTurn === user.id ? 'Ваш ход' : 'Ход соперника';
  }, [room, user]);

  const fetchShots = useCallback(async () => {
    if (!roomId.trim()) {
      setShots([]);
      return;
    }
    setShotsLoading(true);
    try {
      const { shots: list } = await getShots(roomId.trim());
      setShots(list);
      setOptimisticShots((prev) =>
        prev.filter(
          (cell) =>
            !list.some(
              (shot) =>
                shot.playerId === user?.id && shot.x === cell.x && shot.y === cell.y
            )
        )
      );
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось загрузить историю выстрелов'
      );
    } finally {
      setShotsLoading(false);
    }
  }, [roomId, setShots, user?.id]);

  const fetchRoomState = useCallback(async () => {
    if (!roomId.trim()) {
      setRoom(null);
      return;
    }
    setRoomLoading(true);
    try {
      const { room: current } = await getRoom(roomId.trim());
      setRoom(current ?? null);
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось обновить состояние комнаты'
      );
    } finally {
      setRoomLoading(false);
    }
  }, [roomId, setRoom]);

  const fetchMyFleet = useCallback(async () => {
    if (!roomId.trim()) {
      setMyShips([]);
      return;
    }
    try {
      const { myShips } = await getMyShips(roomId.trim());
      setMyShips(myShips);
    } catch (err) {
      setBattleStatus(
        err instanceof Error ? err.message : 'Не удалось загрузить ваши корабли'
      );
    }
  }, [roomId, setMyShips]);

  useEffect(() => {
    reset();
    if (!roomId.trim()) {
      return;
    }
    fetchShots();
    fetchRoomState();
    fetchMyFleet();
  }, [roomId, fetchShots, fetchRoomState, fetchMyFleet, reset]);

  useEffect(
    () => () => {
      reset();
    },
    [reset]
  );

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
          addShot(shot);
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
    [roomId, user?.id, addShot],
    Boolean(roomId.trim())
  );

  useSubscription(
    () =>
      subscribeToRoomUpdates(roomId.trim(), {
        onData: (payload) => setRoom(payload),
        onError: (err) =>
          setBattleStatus(
            err instanceof Error ? err.message : 'Ошибка подписки на состояние комнаты.'
          ),
      }),
    [roomId, setRoom],
    Boolean(roomId.trim())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

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
      addShot(shot);
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
      clearOptimisticShot(x, y);
    } finally {
      setShotLoading(false);
    }
  };

  const renderBoard = (
    title: string,
    shotMap: Map<string, Shot>,
    interactive: boolean,
    shipSet?: Set<string>
  ) => (
    <div className="rounded-2xl border border-white/10 bg-sea-panel/80 p-4 shadow-2xl">
      <div className="flex items-center justify-between text-sm uppercase tracking-wide text-slate-300">
        <span>{title}</span>
        <span>{interactive ? 'Цельтесь' : 'Оборона'}</span>
      </div>
      <div
        className="mt-4 grid grid-cols-10 gap-1 sm:gap-1.5"
        role="grid"
        aria-label={`${title}. Поле 10 на 10.`}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, y) =>
          Array.from({ length: BOARD_SIZE }).map((__, x) => {
            const key = cellKey(x, y);
            const shot = shotMap.get(key);
            const pending = interactive && optimisticShotSet.has(key);
            const hasShip = Boolean(shipSet?.has(key));
            let bg = 'bg-white/5 border border-white/10 text-slate-50';
            if (pending) {
              bg = 'bg-indigo-500/20 border border-indigo-300/40 text-indigo-100';
            } else if (shot?.result === 'miss') {
              bg = 'bg-sea-miss/20 border border-sea-miss/40 text-sea-miss';
            } else if (shot?.result === 'hit') {
              bg = 'bg-sea-hit/30 border border-sea-hit/60 text-sea-hit';
            } else if (shot?.result === 'sunk') {
              bg = 'bg-sea-sunk/25 border border-sea-sunk/60 text-sea-sunk';
            } else if (hasShip) {
              bg = 'bg-emerald-400/20 border border-emerald-300/40 text-emerald-200';
            }

            const ariaStatus = shot
              ? shot.result === 'miss'
                ? 'промах'
                : shot.result === 'hit'
                  ? 'попадание'
                  : 'корабль потоплен'
              : pending
                ? 'ожидание результата'
                : hasShip
                  ? 'корабль размещен'
                  : 'пустая клетка';

            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={`flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-accent ${bg}`}
                disabled={!interactive || !!shot || pending || shotLoading}
                onClick={() => interactive && handleShot(x, y)}
                aria-label={`Клетка ${y + 1} по вертикали, ${x + 1} по горизонтали. ${ariaStatus}.`}
              >
                {shot
                  ? shot.result === 'miss'
                    ? '•'
                    : shot.result === 'hit'
                      ? '✕'
                      : '☠'
                  : pending
                    ? '?'
                    : hasShip
                      ? '■'
                      : ''}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sea-night text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
        <section className="rounded-3xl border border-white/10 bg-sea-panel/80 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                SeaBattle • Комната {roomId || '—'}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Следите за чатом, статусом комнаты и делайте выстрелы в реальном времени.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/20 px-3 py-1" aria-live="polite">
                {turnLabel}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1">
                Статус: {room?.status ?? '—'}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[2fr,1fr]">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">ID комнаты</span>
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Вставьте ID комнаты"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sea-accent/60"
              />
              <span className="text-xs text-slate-400">
                Перейдите в комнату через лобби или вставьте ID вручную, чтобы сделать ход.
              </span>
            </label>

            <div className="flex flex-col gap-2 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Игрок: {user?.username ?? 'Гость'}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Участники: {room?.participants.length ?? 0}/2
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {renderBoard('Поле соперника', playerShotMap, Boolean(canShoot))}
          {renderBoard('Ваше поле', opponentShotMap, false, shipCells)}
        </section>

        {(battleStatus || roomLoading || shotsLoading) && (
          <div className="rounded-2xl border border-white/10 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {roomLoading || shotsLoading ? 'Обновляем состояние боя...' : battleStatus}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-sea-panel/80 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Чат</h2>
            <span className="text-sm text-slate-400">
              {roomId ? `Комната ${roomId}` : 'Выберите комнату'}
            </span>
          </div>
          <div
            ref={scrollRef}
            className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-4"
          >
            {chatLoading && <div className="text-sm text-slate-400">Загрузка сообщений...</div>}
            {!chatLoading && messages.length === 0 && (
              <div className="text-sm text-slate-400">Сообщений пока нет. Станьте первым!</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-xl rounded-2xl px-4 py-2 text-sm ${
                  msg.userId === user?.id
                    ? 'self-end bg-sea-accent/30 text-white shadow-lg'
                    : 'self-start bg-white/10 text-slate-100'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-slate-300">
                  <span>{msg.username}</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Сообщение..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sea-accent/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="rounded-2xl bg-sea-accent/80 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-sea-accent"
              onClick={handleSend}
              disabled={!roomId.trim()}
            >
              Отправить
            </button>
          </div>
          {chatStatus && (
            <div className="mt-2 text-sm text-amber-200" role="status">
              {chatStatus}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GamePage;
