import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRoom, getMyRooms, getPublicRooms, joinRoom, leaveRoom, searchRooms, } from '../api/client';
const LobbyPage = () => {
    const navigate = useNavigate();
    const [publicRooms, setPublicRooms] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', password: '' });
    const [joinForm, setJoinForm] = useState({ roomId: '', password: '' });
    const roomsToShow = useMemo(() => (searchResults ? searchResults : publicRooms), [publicRooms, searchResults]);
    const loadRooms = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const [publicRes, myRes] = await Promise.all([getPublicRooms(), getMyRooms()]);
            setPublicRooms(publicRes.getPublicRooms);
            setMyRooms(myRes.getMyRooms);
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : 'Не удалось загрузить комнаты');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadRooms();
    }, []);
    const handleSearch = async (event) => {
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
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : 'Не удалось выполнить поиск');
        }
        finally {
            setSearching(false);
        }
    };
    const handleCreateRoom = async (event) => {
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
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : 'Не удалось создать комнату');
        }
    };
    const handleJoinRoom = async (event) => {
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
            navigate(`/game/${result.joinRoom.id}`);
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : 'Не удалось присоединиться к комнате');
        }
    };
    const handleLeaveRoom = async (roomId) => {
        setStatus(null);
        try {
            await leaveRoom(roomId);
            await loadRooms();
        }
        catch (err) {
            setStatus(err instanceof Error ? err.message : 'Не удалось покинуть комнату');
        }
    };
    const handlePrefillJoin = (roomId) => {
        setJoinForm((prev) => ({ ...prev, roomId }));
    };
    const occupancy = (room) => `${room.participants.length}/${room.maxPlayers}`;
    return (_jsx("div", { className: "page", children: _jsxs("div", { className: "card wide-card", children: [_jsxs("div", { className: "hero-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "title", children: "\u041B\u043E\u0431\u0431\u0438" }), _jsx("p", { className: "subtitle", children: "\u041F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0439\u0442\u0435 \u0441\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u043C\u043D\u0430\u0442, \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0438 \u0438 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C \u043A \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u043C." })] }), _jsx(Link, { to: "/", className: "pill ghost", style: { textDecoration: 'none' }, children: "\u2190 \u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E" })] }), _jsxs("div", { className: "lobby-grid", children: [_jsxs("form", { className: "panel-card", onSubmit: handleCreateRoom, children: [_jsx("h3", { className: "panel-title", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u043D\u0430\u0442\u0443" }), _jsxs("label", { children: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", _jsx("input", { value: createForm.name, onChange: (e) => setCreateForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, '\u0411\u043E\u0439 \u21161'" })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u043E\u043B\u044C (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", _jsx("input", { value: createForm.password, onChange: (e) => setCreateForm((prev) => ({ ...prev, password: e.target.value })), placeholder: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u043E\u0439 \u043A\u043E\u043C\u043D\u0430\u0442\u044B" })] }), _jsx("button", { type: "submit", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] }), _jsxs("form", { className: "panel-card", onSubmit: handleJoinRoom, children: [_jsx("h3", { className: "panel-title", children: "\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043F\u043E ID" }), _jsxs("label", { children: ["ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B", _jsx("input", { value: joinForm.roomId, onChange: (e) => setJoinForm((prev) => ({ ...prev, roomId: e.target.value })), placeholder: "64ef...abc" })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u043E\u043B\u044C (\u0435\u0441\u043B\u0438 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F)", _jsx("input", { value: joinForm.password, onChange: (e) => setJoinForm((prev) => ({ ...prev, password: e.target.value })) })] }), _jsx("button", { type: "submit", children: "\u0412\u043E\u0439\u0442\u0438" })] })] }), _jsxs("form", { className: "panel-card", onSubmit: handleSearch, children: [_jsx("h3", { className: "panel-title", children: "\u041F\u043E\u0438\u0441\u043A \u043A\u043E\u043C\u043D\u0430\u0442" }), _jsxs("div", { className: "placement-bar", children: [_jsx("input", { value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsxs("div", { className: "bar-actions", children: [_jsx("button", { type: "submit", disabled: searching, children: searching ? 'Поиск...' : 'Искать' }), _jsx("button", { type: "button", className: "ghost", onClick: () => {
                                                setSearchTerm('');
                                                setSearchResults(null);
                                            }, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C" })] })] })] }), status && _jsx("div", { className: "status", children: status }), loading && _jsx("div", { className: "muted", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043C\u043D\u0430\u0442..." }), _jsxs("section", { className: "panel-card", children: [_jsx("div", { className: "panel-title", children: "\u041C\u043E\u0438 \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), myRooms.length === 0 && _jsx("div", { className: "muted", children: "\u0412\u044B \u0435\u0449\u0451 \u043D\u0435 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0438\u0441\u044C \u043D\u0438 \u043A \u043E\u0434\u043D\u043E\u0439 \u043A\u043E\u043C\u043D\u0430\u0442\u0435." }), _jsx("div", { className: "room-list", children: myRooms.map((room) => (_jsxs("div", { className: "room-card", children: [_jsxs("div", { children: [_jsx("div", { className: "room-name", children: room.name }), _jsxs("div", { className: "muted", children: ["\u0421\u0442\u0430\u0442\u0443\u0441: ", room.status, " \u2022 \u0418\u0433\u0440\u043E\u043A\u0438: ", occupancy(room)] })] }), _jsxs("div", { className: "room-actions", children: [_jsx("button", { type: "button", onClick: () => navigate(`/game/${room.id}`), children: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438" }), _jsx("button", { type: "button", className: "ghost", onClick: () => handleLeaveRoom(room.id), children: "\u041F\u043E\u043A\u0438\u043D\u0443\u0442\u044C" })] })] }, room.id))) })] }), _jsxs("section", { className: "panel-card", children: [_jsx("div", { className: "panel-title", children: searchResults ? 'Результаты поиска' : 'Публичные комнаты' }), roomsToShow.length === 0 && (_jsx("div", { className: "muted", children: searchResults ? 'По вашему запросу ничего не найдено.' : 'Пока нет доступных комнат.' })), _jsx("div", { className: "room-list", children: roomsToShow.map((room) => (_jsxs("div", { className: "room-card", children: [_jsxs("div", { children: [_jsx("div", { className: "room-name", children: room.name }), _jsxs("div", { className: "muted", children: ["ID: ", room.id.slice(0, 6), "\u2026 \u2022 \u0418\u0433\u0440\u043E\u043A\u0438: ", occupancy(room), " \u2022 \u0421\u0442\u0430\u0442\u0443\u0441: ", room.status] })] }), _jsx("div", { className: "room-actions", children: _jsx("button", { type: "button", onClick: () => handlePrefillJoin(room.id), children: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C ID" }) })] }, room.id))) })] })] }) }));
};
export default LobbyPage;
