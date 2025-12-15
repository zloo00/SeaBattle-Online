import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "page", children: [_jsxs("div", { className: "card wide-card", children: [_jsxs("div", { className: "hero-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "title", children: "SeaBattle Online" }), _jsx("p", { className: "subtitle", children: "\u0420\u0435\u0430\u043B\u044C\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F, \u043A\u043E\u043C\u043D\u0430\u0442\u044B 1 \u043D\u0430 1, \u0447\u0430\u0442 \u0438 \u0442\u0443\u0440\u044B. \u041D\u0430\u0447\u043D\u0438 \u0441 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438\u043B\u0438 \u0432\u0445\u043E\u0434\u0430." })] }), _jsx("div", { className: "badge", children: "10x10" })] }), user ? (_jsxs("div", { className: "placement-shell", children: [_jsxs("div", { className: "pill info-pill", children: [_jsxs("span", { children: ["\u041F\u0440\u0438\u0432\u0435\u0442, ", user.username] }), _jsxs("span", { className: "muted", children: ["\u0410\u043A\u043A\u0430\u0443\u043D\u0442: ", user.email] })] }), _jsxs("div", { className: "placement-bar", children: [_jsxs("div", { className: "bar-text", children: [_jsx("div", { className: "eyebrow", children: "ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsx("input", { value: roomId, onChange: (e) => setRoomId(e.target.value), placeholder: "\u0412\u0441\u0442\u0430\u0432\u044C ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B, \u043A \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F" }), _jsx("div", { className: "muted", children: "\u041D\u0443\u0436\u0435\u043D, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0432\u043E\u044E \u0440\u0430\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443 \u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0438\u0433\u0440\u0443 \u043F\u043E\u0437\u0436\u0435." })] }), _jsxs("div", { className: "bar-actions", children: [_jsx("button", { type: "button", onClick: () => setPlacementOpen(true), children: "\u0420\u0430\u0441\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u0440\u0430\u0431\u043B\u0438" }), _jsx(Link, { to: "/lobby", children: _jsx("button", { type: "button", className: "ghost", children: "?????" }) }), _jsx("button", { type: "button", onClick: () => navigate(roomId ? `/game/${roomId}` : "/game"), className: "ghost", children: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442 \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsx("button", { type: "button", className: "ghost", onClick: () => {
                                                    logout();
                                                    navigate("/login");
                                                }, children: "\u0412\u044B\u0439\u0442\u0438" })] })] })] })) : (_jsxs("div", { style: { display: "flex", gap: "12px" }, children: [_jsx(Link, { to: "/login", children: _jsx("button", { type: "button", children: "\u0412\u043E\u0439\u0442\u0438" }) }), _jsx(Link, { to: "/register", children: _jsx("button", { type: "button", children: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F" }) })] }))] }), _jsx(PlacementModal, { open: placementOpen, roomId: roomId, onRoomIdChange: setRoomId, onClose: () => setPlacementOpen(false) })] }));
};
const AuthRedirect = ({ children }) => {
    const { user } = useAuthStore();
    const location = useLocation();
    if (user && (location.pathname === "/login" || location.pathname === "/register")) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return children;
};
const RequireAuth = ({ children }) => {
    const { user } = useAuthStore();
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return children;
};
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(AuthRedirect, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(AuthRedirect, { children: _jsx(RegisterPage, {}) }) }), _jsx(Route, { path: "/game/:roomId?", element: _jsx(RequireAuth, { children: _jsx(GamePage, {}) }) }), _jsx(Route, { path: "/lobby", element: _jsx(RequireAuth, { children: _jsx(LobbyPage, {}) }) })] }));
}
export default App;
