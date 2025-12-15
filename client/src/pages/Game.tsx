import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getMessages, sendMessage, subscribeToMessages } from "../api/client";
import { Message } from "../types";
import { useAuthStore } from "../store/auth";

const GamePage = () => {
  const { roomId: routeRoomId } = useParams();
  const [roomId, setRoomId] = useState(routeRoomId ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((s) => s.user);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [messages]
  );

  useEffect(() => {
    setStatus(null);
    if (!roomId.trim()) {
      setMessages([]);
      return;
    }
    setLoading(true);
    getMessages(roomId.trim())
      .then(({ messages: list }) => setMessages(list))
      .catch((err) =>
        setStatus(err instanceof Error ? err.message : "Не удалось загрузить сообщения")
      )
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId.trim()) {
      return;
    }
    const dispose = subscribeToMessages(roomId.trim(), {
      onData: (message) =>
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          return exists ? prev : [...prev, message];
        }),
      onError: (err) =>
        setStatus(
          err instanceof Error
            ? err.message
            : "Подписка на сообщения прервалась. Перезагрузите страницу."
        )
    });
    return () => dispose();
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sortedMessages.length]);

  const handleSend = async () => {
    if (!roomId.trim() || !input.trim()) {
      setStatus("Введите текст и ID комнаты.");
      return;
    }
    setStatus(null);
    const text = input.trim();
    setInput("");
    try {
      const { sendMessage: message } = await sendMessage({ roomId: roomId.trim(), text });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Не удалось отправить сообщение");
    }
  };

  return (
    <div className="page">
      <div className="card wide-card">
        <div className="hero-row">
          <div>
            <h1 className="title">Комната: {roomId || "—"}</h1>
            <p className="subtitle">
              Чат комнаты. Получай live обновления и переписывайся с соперником.
            </p>
          </div>
          <div className="badge">Чат</div>
        </div>

        <div className="placement-bar chat-bar">
          <div className="bar-text">
            <div className="eyebrow">ID комнаты</div>
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Вставь ID комнаты"
            />
            <div className="muted">Сообщения видят только участники комнаты.</div>
          </div>
          <div className="bar-actions">
            <div className="pill info-pill">
              {user?.username ?? "Неизвестно"}
              <span className="muted">онлайн</span>
            </div>
          </div>
        </div>

        <div className="chat-shell">
          <div className="chat-feed" ref={scrollRef}>
            {loading && <div className="muted">Загрузка сообщений...</div>}
            {!loading && sortedMessages.length === 0 && (
              <div className="muted">Сообщений пока нет. Напиши первым!</div>
            )}
            {sortedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-item ${msg.userId === user?.id ? "own" : ""}`}
              >
                <div className="chat-meta">
                  <span className="chat-author">{msg.username}</span>
                  <span className="muted">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="button" onClick={handleSend} disabled={!roomId.trim()}>
              Отправить
            </button>
          </div>
          {status && <div className="status">{status}</div>}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
