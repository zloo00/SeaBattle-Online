import { ShipInput } from "./gameSchemas";

const BOARD_SIZE = 10;
const REQUIRED_SHIPS: Record<number, number> = {
  4: 1,
  3: 2,
  2: 3,
  1: 4
};

const TOTAL_SHIPS = Object.values(REQUIRED_SHIPS).reduce((sum, count) => sum + count, 0);

export const expandShipCells = (ship: ShipInput) => {
  const dx = ship.orientation === "horizontal" ? 1 : 0;
  const dy = ship.orientation === "vertical" ? 1 : 0;

  return Array.from({ length: ship.length }, (_, idx) => ({
    x: ship.startX + dx * idx,
    y: ship.startY + dy * idx
  }));
};

const isInsideBoard = (ship: ShipInput) => {
  const cells = expandShipCells(ship);
  return cells.every(
    (cell) =>
      cell.x >= 0 && cell.x < BOARD_SIZE && cell.y >= 0 && cell.y < BOARD_SIZE
  );
};

export const validateShipFleet = (ships: ShipInput[]) => {
  if (ships.length !== TOTAL_SHIPS) {
    throw new Error(`Нужно разместить ${TOTAL_SHIPS} кораблей согласно правилам.`);
  }

  const occupied = new Set<string>();
  const counts = new Map<number, number>();

  ships.forEach((ship, idx) => {
    if (!isInsideBoard(ship)) {
      throw new Error(`Корабль №${idx + 1} выходит за пределы поля 10x10.`);
    }

    const cells = expandShipCells(ship);
    cells.forEach((cell) => {
      const key = `${cell.x}-${cell.y}`;
      if (occupied.has(key)) {
        throw new Error("Корабли не должны пересекаться.");
      }
      occupied.add(key);
    });

    const newCount = (counts.get(ship.length) ?? 0) + 1;
    counts.set(ship.length, newCount);
  });

  Object.entries(REQUIRED_SHIPS).forEach(([length, requiredCount]) => {
    const lengthNum = Number(length);
    const actual = counts.get(lengthNum) ?? 0;
    if (actual !== requiredCount) {
      throw new Error(
        `Неверное количество кораблей длины ${length}: нужно ${requiredCount}, есть ${actual}.`
      );
    }
  });
};

export const fleetRules = REQUIRED_SHIPS;
