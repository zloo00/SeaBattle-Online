import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getMessages, sendMessage, subscribeToMessages } from "../api/client";
import { useAuthStore } from "../store/auth";
const GamePage = () => {
    const { roomId: routeRoomId } = useParams();
    const [roomId, setRoomId] = useState(routeRoomId ?? "");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const user = useAuthStore((s) => s.user);
    const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [messages]);
    useEffect(() => {
        setStatus(null);
        if (!roomId.trim()) {
            setMessages([]);
            return;
        }
        setLoading(true);
        getMessages(roomId.trim())
            .then(({ messages: list }) => setMessages(list))
            .catch((err) => setStatus(err instanceof Error ? err.message : "Не удалось загрузить сообщения"))
            .finally(() => setLoading(false));
    }, [roomId]);
    useEffect(() => {
        if (!roomId.trim()) {
            return;
        }
        const dispose = subscribeToMessages(roomId.trim(), {
            onData: (message) => setMessages((prev) => {
                const exists = prev.some((m) => m.id === message.id);
                return exists ? prev : [...prev, message];
            }),
            onError: (err) => setStatus(err instanceof Error
                ? err.message
                : "Подписка на сообщения прервалась. Перезагрузите страницу.")
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
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : "Не удалось отправить сообщение");
        }
    };
    return (_jsx("div", { className: "page", children: _jsxs("div", { className: "card wide-card", children: [_jsxs("div", { className: "hero-row", children: [_jsxs("div", { children: [_jsxs("h1", { className: "title", children: ["\u041A\u043E\u043C\u043D\u0430\u0442\u0430: ", roomId || "—"] }), _jsx("p", { className: "subtitle", children: "\u0427\u0430\u0442 \u043A\u043E\u043C\u043D\u0430\u0442\u044B. \u041F\u043E\u043B\u0443\u0447\u0430\u0439 live \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0438 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u044B\u0432\u0430\u0439\u0441\u044F \u0441 \u0441\u043E\u043F\u0435\u0440\u043D\u0438\u043A\u043E\u043C." })] }), _jsx("div", { className: "badge", children: "\u0427\u0430\u0442" })] }), _jsxs("div", { className: "placement-bar chat-bar", children: [_jsxs("div", { className: "bar-text", children: [_jsx("div", { className: "eyebrow", children: "ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsx("input", { value: roomId, onChange: (e) => setRoomId(e.target.value), placeholder: "\u0412\u0441\u0442\u0430\u0432\u044C ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsx("div", { className: "muted", children: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0432\u0438\u0434\u044F\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u043A\u043E\u043C\u043D\u0430\u0442\u044B." })] }), _jsx("div", { className: "bar-actions", children: _jsxs("div", { className: "pill info-pill", children: [user?.username ?? "Неизвестно", _jsx("span", { className: "muted", children: "\u043E\u043D\u043B\u0430\u0439\u043D" })] }) })] }), _jsxs("div", { className: "chat-shell", children: [_jsxs("div", { className: "chat-feed", ref: scrollRef, children: [loading && _jsx("div", { className: "muted", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439..." }), !loading && sortedMessages.length === 0 && (_jsx("div", { className: "muted", children: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u041D\u0430\u043F\u0438\u0448\u0438 \u043F\u0435\u0440\u0432\u044B\u043C!" })), sortedMessages.map((msg) => (_jsxs("div", { className: `chat-item ${msg.userId === user?.id ? "own" : ""}`, children: [_jsxs("div", { className: "chat-meta", children: [_jsx("span", { className: "chat-author", children: msg.username }), _jsx("span", { className: "muted", children: new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }) })] }), _jsx("div", { className: "chat-bubble", children: msg.text })] }, msg.id)))] }), _jsxs("div", { className: "chat-input-row", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), placeholder: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435...", onKeyDown: (e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    } }), _jsx("button", { type: "button", onClick: handleSend, disabled: !roomId.trim(), children: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C" })] }), status && _jsx("div", { className: "status", children: status })] })] }) }));
};
export default GamePage;
