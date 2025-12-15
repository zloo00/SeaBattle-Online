import { z } from "zod";

export const coordinateSchema = z.number().int().min(0).max(9);

export const shotInputSchema = z.object({
  roomId: z.string().trim(),
  playerId: z.string().trim(),
  x: coordinateSchema,
  y: coordinateSchema,
  result: z.enum(["miss", "hit", "sunk"])
});

export const shipSchema = z.object({
  startX: coordinateSchema,
  startY: coordinateSchema,
  length: z.number().int().min(1).max(4),
  orientation: z.enum(["horizontal", "vertical"])
});

export const shipPlacementSchema = shipSchema.extend({
  roomId: z.string().trim(),
  playerId: z.string().trim()
});

export const placeShipsSchema = z.object({
  roomId: z.string().trim(),
  ships: z.array(shipSchema).min(1).max(10)
});

export const messageInputSchema = z.object({
  roomId: z.string().trim(),
  text: z.string().trim().min(1).max(500)
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(3).max(50),
  password: z.string().trim().max(128).optional()
});

export const joinRoomSchema = z.object({
  roomId: z.string().trim(),
  password: z.string().trim().max(128).optional()
});

export const leaveRoomSchema = z.object({
  roomId: z.string().trim()
});

export const roomSearchSchema = z.object({
  term: z.string().trim().min(1).max(50)
});

export type ShotInput = z.infer<typeof shotInputSchema>;
export type ShipInput = z.infer<typeof shipSchema>;
export type ShipPlacementInput = z.infer<typeof shipPlacementSchema>;
export type PlaceShipsInput = z.infer<typeof placeShipsSchema>;
export type MessageInput = z.infer<typeof messageInputSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type RoomSearchInput = z.infer<typeof roomSearchSchema>;
