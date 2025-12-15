import { HydratedDocument } from "mongoose";
import { IShip } from "../models/ship";
import { expandShipCells } from "../validation/shipValidation";

export type ShipDocument = HydratedDocument<IShip>;

export const checkHit = (ships: ShipDocument[], x: number, y: number) => {
  for (const ship of ships) {
    const cells = expandShipCells({
      startX: ship.startX,
      startY: ship.startY,
      length: ship.length,
      orientation: ship.orientation
    });
    if (cells.some((cell) => cell.x === x && cell.y === y)) {
      return ship;
    }
  }
  return null;
};

export const checkSunk = (ship: ShipDocument) => {
  return ship.hits >= ship.length;
};

export const checkWin = (ships: ShipDocument[]) => {
  if (!ships.length) {
    return false;
  }
  return ships.every((ship) => checkSunk(ship));
};
