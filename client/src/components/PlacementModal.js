import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { getMyShips, placeShips } from "../api/client";
const BOARD_SIZE = 10;
const REQUIRED_SHIPS = {
    4: 1,
    3: 2,
    2: 3,
    1: 4
};
const TOTAL_REQUIRED = Object.values(REQUIRED_SHIPS).reduce((sum, count) => sum + count, 0);
const cellKey = (x, y) => `${x}-${y}`;
const expandShip = (ship) => {
    const dx = ship.orientation === "horizontal" ? 1 : 0;
    const dy = ship.orientation === "vertical" ? 1 : 0;
    return Array.from({ length: ship.length }, (_, idx) => ({
        x: ship.startX + dx * idx,
        y: ship.startY + dy * idx
    }));
};
const isInsideBoard = (ship) => {
    const cells = expandShip(ship);
    return cells.every((cell) => cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE);
};
const validateFleet = (ships) => {
    if (ships.length > TOTAL_REQUIRED) {
        return "Лимит кораблей превышен. Удалите лишние.";
    }
    const occupied = new Set();
    const remaining = { ...REQUIRED_SHIPS };
    for (const ship of ships) {
        if (!isInsideBoard(ship)) {
            return "Корабль выходит за пределы поля.";
        }
        const cells = expandShip(ship);
        for (const cell of cells) {
            const key = cellKey(cell.x, cell.y);
            if (occupied.has(key)) {
                return "Корабли пересекаются. Переставьте их.";
            }
            occupied.add(key);
        }
        remaining[ship.length] = (remaining[ship.length] ?? 0) - 1;
    }
    const missing = Object.entries(remaining).find(([, count]) => count !== 0);
    if (missing) {
        const [len, count] = missing;
        return count > 0
            ? `Добавьте ещё ${count} корабл${Number(count) === 1 ? "ь" : "я"} длины ${len}.`
            : `Уберите лишние корабли длины ${len}.`;
    }
    return null;
};
const checkCandidate = (candidate, current) => {
    const allowed = REQUIRED_SHIPS[candidate.length] ?? 0;
    const sameLength = current.filter((ship) => ship.length === candidate.length).length;
    if (sameLength >= allowed) {
        return "Лимит кораблей этой длины исчерпан.";
    }
    if (!isInsideBoard(candidate)) {
        return "Корабль должен помещаться в поле 10x10.";
    }
    const occupied = new Set();
    current.forEach((ship) => expandShip(ship).forEach((cell) => occupied.add(cellKey(cell.x, cell.y))));
    const collision = expandShip(candidate).some((cell) => occupied.has(cellKey(cell.x, cell.y)));
    if (collision) {
        return "Нельзя пересекать корабли.";
    }
    return null;
};
const buildInput = (roomId, ships) => ({
    roomId,
    ships: ships.map((ship) => ({
        startX: ship.startX,
        startY: ship.startY,
        length: ship.length,
        orientation: ship.orientation
    }))
});
const generateFleet = () => {
    const layout = [];
    const pool = Object.entries(REQUIRED_SHIPS).flatMap(([len, count]) => Array.from({ length: count }, () => Number(len)));
    let attempts = 0;
    const maxAttempts = 5000;
    while (pool.length && attempts < maxAttempts) {
        const index = Math.floor(Math.random() * pool.length);
        const length = pool[index];
        const orientation = Math.random() > 0.5 ? "horizontal" : "vertical";
        const startX = Math.floor(Math.random() * BOARD_SIZE);
        const startY = Math.floor(Math.random() * BOARD_SIZE);
        const candidate = { startX, startY, length, orientation };
        const error = checkCandidate(candidate, layout);
        if (!error) {
            layout.push(candidate);
            pool.splice(index, 1);
        }
        attempts += 1;
    }
    if (pool.length) {
        throw new Error("Не удалось автоматически расставить корабли. Попробуйте ещё раз.");
    }
    return layout;
};
export const PlacementModal = ({ open, roomId, onRoomIdChange, onClose }) => {
    const [orientation, setOrientation] = useState("horizontal");
    const [selectedLength, setSelectedLength] = useState(4);
    const [ships, setShips] = useState([]);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const occupiedMap = useMemo(() => {
        const map = new Map();
        ships.forEach((ship, idx) => {
            expandShip(ship).forEach((cell) => map.set(cellKey(cell.x, cell.y), idx));
        });
        return map;
    }, [ships]);
    const remainingFleet = useMemo(() => {
        const counts = { ...REQUIRED_SHIPS };
        ships.forEach((ship) => {
            counts[ship.length] = (counts[ship.length] ?? 0) - 1;
        });
        return counts;
    }, [ships]);
    useEffect(() => {
        if (!open) {
            return;
        }
        setMessage(null);
        if (!roomId.trim()) {
            setShips([]);
            return;
        }
        setLoadingExisting(true);
        getMyShips(roomId.trim())
            .then(({ myShips }) => {
            setShips(myShips.map((ship) => ({
                startX: ship.startX,
                startY: ship.startY,
                length: ship.length,
                orientation: ship.orientation
            })));
        })
            .catch((err) => setMessage(err instanceof Error ? err.message : "Не удалось загрузить существующую расстановку."))
            .finally(() => setLoadingExisting(false));
    }, [open, roomId]);
    if (!open) {
        return null;
    }
    const fleetStatus = validateFleet(ships);
    const fleetReady = !fleetStatus && ships.length === TOTAL_REQUIRED;
    const handleCellClick = (x, y) => {
        setMessage(null);
        const existingShipIndex = occupiedMap.get(cellKey(x, y));
        if (existingShipIndex !== undefined) {
            setShips((prev) => prev.filter((_, idx) => idx !== existingShipIndex));
            return;
        }
        if (!selectedLength) {
            setMessage("Выберите длину корабля слева.");
            return;
        }
        const candidate = {
            startX: x,
            startY: y,
            length: selectedLength,
            orientation
        };
        const error = checkCandidate(candidate, ships);
        if (error) {
            setMessage(error);
            return;
        }
        setShips((prev) => [...prev, candidate]);
    };
    const handleSave = async () => {
        setMessage(null);
        if (!roomId.trim()) {
            setMessage("Укажите ID комнаты.");
            return;
        }
        const validation = validateFleet(ships);
        if (validation) {
            setMessage(validation);
            return;
        }
        const payload = buildInput(roomId.trim(), ships);
        setSaving(true);
        try {
            await placeShips(payload);
            setMessage("Расстановка сохранена. Ждите соперника!");
        }
        catch (err) {
            setMessage(err instanceof Error ? err.message : "Не удалось сохранить расстановку.");
        }
        finally {
            setSaving(false);
        }
    };
    const handleAutoPlace = () => {
        setMessage(null);
        try {
            const layout = generateFleet();
            setShips(layout);
            setMessage("Корабли расставлены автоматически.");
        }
        catch (err) {
            setMessage(err instanceof Error ? err.message : "Не удалось автозаполнить поле.");
        }
    };
    const handleClear = () => {
        setShips([]);
        setMessage(null);
    };
    return (_jsx("div", { className: "placement-overlay", children: _jsxs("div", { className: "placement-modal", children: [_jsxs("div", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("div", { className: "eyebrow", children: "\u0420\u0430\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043A\u043E\u0440\u0430\u0431\u043B\u0435\u0439" }), _jsx("h3", { className: "modal-title", children: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C \u043F\u043E\u043B\u0435 \u0431\u043E\u044F" })] }), _jsx("button", { type: "button", className: "ghost", onClick: onClose, children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })] }), _jsxs("div", { className: "room-row", children: [_jsx("label", { className: "inline-label", htmlFor: "room-id", children: "ID \u043A\u043E\u043C\u043D\u0430\u0442\u044B" }), _jsx("input", { id: "room-id", value: roomId, onChange: (e) => onRoomIdChange(e.target.value), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, 64c...b7" })] }), _jsxs("div", { className: "placement-body", children: [_jsxs("div", { className: "grid-wrapper", children: [_jsxs("div", { className: "grid-header", children: [_jsxs("div", { children: [_jsx("div", { className: "eyebrow", children: "\u041F\u043E\u043B\u0435 10 x 10" }), _jsx("div", { className: "muted", children: "\u041A\u043B\u0438\u043A \u043F\u043E \u043F\u0443\u0441\u0442\u043E\u0439 \u043A\u043B\u0435\u0442\u043A\u0435 \u2014 \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u0440\u0430\u0431\u043B\u044C. \u041A\u043B\u0438\u043A \u043F\u043E \u0437\u0430\u043D\u044F\u0442\u043E\u0439 \u2014 \u0443\u0431\u0440\u0430\u0442\u044C \u0435\u0433\u043E." })] }), loadingExisting && _jsx("div", { className: "pill", children: "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C..." })] }), _jsx("div", { className: "board-grid", style: { gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }, children: Array.from({ length: BOARD_SIZE }).map((_, y) => Array.from({ length: BOARD_SIZE }).map((__, x) => {
                                        const idx = occupiedMap.get(cellKey(x, y));
                                        return (_jsx("button", { type: "button", className: `grid-cell ${idx !== undefined ? "ship-cell" : ""}`, onClick: () => handleCellClick(x, y), children: " " }, cellKey(x, y)));
                                    })) })] }), _jsxs("div", { className: "side-panel", children: [_jsxs("div", { className: "panel-card", children: [_jsx("div", { className: "panel-title", children: "\u0414\u043B\u0438\u043D\u0430 \u043A\u043E\u0440\u0430\u0431\u043B\u044F" }), _jsx("div", { className: "length-row", children: [4, 3, 2, 1].map((len) => (_jsxs("button", { type: "button", className: `length-chip ${selectedLength === len ? "active" : ""}`, onClick: () => setSelectedLength(len), children: [len, "-\u043F\u0430\u043B\u0443\u0431\u043D.", _jsxs("span", { className: "pill small", children: ["\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", Math.max(remainingFleet[len] ?? 0, 0)] })] }, len))) })] }), _jsxs("div", { className: "panel-card", children: [_jsx("div", { className: "panel-title", children: "\u041E\u0440\u0438\u0435\u043D\u0442\u0430\u0446\u0438\u044F" }), _jsxs("div", { className: "orientation-row", children: [_jsx("button", { type: "button", className: `toggle ${orientation === "horizontal" ? "active" : ""}`, onClick: () => setOrientation("horizontal"), children: "\u0413\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u043E" }), _jsx("button", { type: "button", className: `toggle ${orientation === "vertical" ? "active" : ""}`, onClick: () => setOrientation("vertical"), children: "\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u043E" })] })] }), _jsxs("div", { className: "panel-card", children: [_jsx("div", { className: "panel-title", children: "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }), _jsxs("div", { className: "action-row", children: [_jsx("button", { type: "button", className: "ghost", onClick: handleAutoPlace, children: "\u0410\u0432\u0442\u043E-\u0440\u0430\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430" }), _jsx("button", { type: "button", className: "ghost", onClick: handleClear, children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u043B\u0435" })] }), _jsx("button", { type: "button", className: "cta", onClick: handleSave, disabled: saving || !fleetReady, children: saving ? "Сохраняем..." : "Сохранить расстановку" }), !fleetReady && (_jsx("div", { className: "muted", children: fleetStatus ?? "Расставьте все корабли, чтобы продолжить." }))] }), message && _jsx("div", { className: "status", children: message })] })] })] }) }));
};
