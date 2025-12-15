import { useEffect, useMemo, useState } from "react";
import { getMyShips, placeShips } from "../api/client";
import { PlaceShipsInput, ShipOrientation, ShipPlacement } from "../types";

interface PlacementModalProps {
  open: boolean;
  roomId: string;
  onRoomIdChange: (value: string) => void;
  onClose: () => void;
}

const BOARD_SIZE = 10;
const REQUIRED_SHIPS: Record<number, number> = {
  4: 1,
  3: 2,
  2: 3,
  1: 4
};
const TOTAL_REQUIRED = Object.values(REQUIRED_SHIPS).reduce((sum, count) => sum + count, 0);

const cellKey = (x: number, y: number) => `${x}-${y}`;

const expandShip = (ship: ShipPlacement) => {
  const dx = ship.orientation === "horizontal" ? 1 : 0;
  const dy = ship.orientation === "vertical" ? 1 : 0;

  return Array.from({ length: ship.length }, (_, idx) => ({
    x: ship.startX + dx * idx,
    y: ship.startY + dy * idx
  }));
};

const isInsideBoard = (ship: ShipPlacement) => {
  const cells = expandShip(ship);
  return cells.every(
    (cell) =>
      cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE
  );
};

const validateFleet = (ships: ShipPlacement[]) => {
  if (ships.length > TOTAL_REQUIRED) {
    return "Лимит кораблей превышен. Удалите лишние.";
  }

  const occupied = new Set<string>();
  const remaining: Record<number, number> = { ...REQUIRED_SHIPS };

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

const checkCandidate = (candidate: ShipPlacement, current: ShipPlacement[]) => {
  const allowed = REQUIRED_SHIPS[candidate.length] ?? 0;
  const sameLength = current.filter((ship) => ship.length === candidate.length).length;

  if (sameLength >= allowed) {
    return "Лимит кораблей этой длины исчерпан.";
  }
  if (!isInsideBoard(candidate)) {
    return "Корабль должен помещаться в поле 10x10.";
  }

  const occupied = new Set<string>();
  current.forEach((ship) =>
    expandShip(ship).forEach((cell) => occupied.add(cellKey(cell.x, cell.y)))
  );

  const collision = expandShip(candidate).some((cell) => occupied.has(cellKey(cell.x, cell.y)));
  if (collision) {
    return "Нельзя пересекать корабли.";
  }

  return null;
};

const buildInput = (roomId: string, ships: ShipPlacement[]): PlaceShipsInput => ({
  roomId,
  ships: ships.map((ship) => ({
    startX: ship.startX,
    startY: ship.startY,
    length: ship.length,
    orientation: ship.orientation
  }))
});

const generateFleet = () => {
  const layout: ShipPlacement[] = [];
  const pool = Object.entries(REQUIRED_SHIPS).flatMap(([len, count]) =>
    Array.from({ length: count }, () => Number(len))
  );

  let attempts = 0;
  const maxAttempts = 5000;

  while (pool.length && attempts < maxAttempts) {
    const index = Math.floor(Math.random() * pool.length);
    const length = pool[index];
    const orientation: ShipOrientation = Math.random() > 0.5 ? "horizontal" : "vertical";
    const startX = Math.floor(Math.random() * BOARD_SIZE);
    const startY = Math.floor(Math.random() * BOARD_SIZE);
    const candidate: ShipPlacement = { startX, startY, length, orientation };

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

export const PlacementModal = ({
  open,
  roomId,
  onRoomIdChange,
  onClose
}: PlacementModalProps) => {
  const [orientation, setOrientation] = useState<ShipOrientation>("horizontal");
  const [selectedLength, setSelectedLength] = useState<number | null>(4);
  const [ships, setShips] = useState<ShipPlacement[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, number>();
    ships.forEach((ship, idx) => {
      expandShip(ship).forEach((cell) => map.set(cellKey(cell.x, cell.y), idx));
    });
    return map;
  }, [ships]);

  const remainingFleet = useMemo(() => {
    const counts: Record<number, number> = { ...REQUIRED_SHIPS };
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
        setShips(
          myShips.map((ship) => ({
            startX: ship.startX,
            startY: ship.startY,
            length: ship.length,
            orientation: ship.orientation
          }))
        );
      })
      .catch((err) =>
        setMessage(
          err instanceof Error ? err.message : "Не удалось загрузить существующую расстановку."
        )
      )
      .finally(() => setLoadingExisting(false));
  }, [open, roomId]);

  if (!open) {
    return null;
  }

  const fleetStatus = validateFleet(ships);
  const fleetReady = !fleetStatus && ships.length === TOTAL_REQUIRED;

  const handleCellClick = (x: number, y: number) => {
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

    const candidate: ShipPlacement = {
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
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Не удалось сохранить расстановку.");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoPlace = () => {
    setMessage(null);
    try {
      const layout = generateFleet();
      setShips(layout);
      setMessage("Корабли расставлены автоматически.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Не удалось автозаполнить поле.");
    }
  };

  const handleClear = () => {
    setShips([]);
    setMessage(null);
  };

  return (
    <div className="placement-overlay">
      <div className="placement-modal">
        <div className="modal-header">
          <div>
            <div className="eyebrow">Расстановка кораблей</div>
            <h3 className="modal-title">Подготовь поле боя</h3>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="room-row">
          <label className="inline-label" htmlFor="room-id">
            ID комнаты
          </label>
          <input
            id="room-id"
            value={roomId}
            onChange={(e) => onRoomIdChange(e.target.value)}
            placeholder="Например, 64c...b7"
          />
        </div>

        <div className="placement-body">
          <div className="grid-wrapper">
            <div className="grid-header">
              <div>
                <div className="eyebrow">Поле 10 x 10</div>
                <div className="muted">
                  Клик по пустой клетке — поставить корабль. Клик по занятой — убрать его.
                </div>
              </div>
              {loadingExisting && <div className="pill">Загружаем...</div>}
            </div>
            <div
              className="board-grid"
              style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
            >
              {Array.from({ length: BOARD_SIZE }).map((_, y) =>
                Array.from({ length: BOARD_SIZE }).map((__, x) => {
                  const idx = occupiedMap.get(cellKey(x, y));
                  return (
                    <button
                      type="button"
                      key={cellKey(x, y)}
                      className={`grid-cell ${idx !== undefined ? "ship-cell" : ""}`}
                      onClick={() => handleCellClick(x, y)}
                    >
                      {" "}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="side-panel">
            <div className="panel-card">
              <div className="panel-title">Длина корабля</div>
              <div className="length-row">
                {[4, 3, 2, 1].map((len) => (
                  <button
                    key={len}
                    type="button"
                    className={`length-chip ${selectedLength === len ? "active" : ""}`}
                    onClick={() => setSelectedLength(len)}
                  >
                    {len}-палубн.
                    <span className="pill small">
                      Осталось {Math.max(remainingFleet[len] ?? 0, 0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-title">Ориентация</div>
              <div className="orientation-row">
                <button
                  type="button"
                  className={`toggle ${orientation === "horizontal" ? "active" : ""}`}
                  onClick={() => setOrientation("horizontal")}
                >
                  Горизонтально
                </button>
                <button
                  type="button"
                  className={`toggle ${orientation === "vertical" ? "active" : ""}`}
                  onClick={() => setOrientation("vertical")}
                >
                  Вертикально
                </button>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-title">Быстрые действия</div>
              <div className="action-row">
                <button type="button" className="ghost" onClick={handleAutoPlace}>
                  Авто-расстановка
                </button>
                <button type="button" className="ghost" onClick={handleClear}>
                  Очистить поле
                </button>
              </div>
              <button
                type="button"
                className="cta"
                onClick={handleSave}
                disabled={saving || !fleetReady}
              >
                {saving ? "Сохраняем..." : "Сохранить расстановку"}
              </button>
              {!fleetReady && (
                <div className="muted">
                  {fleetStatus ?? "Расставьте все корабли, чтобы продолжить."}
                </div>
              )}
            </div>

            {message && <div className="status">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
