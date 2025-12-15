import { z } from "zod";

export const coordinateSchema = z.number().int().min(0).max(9);

export const shotInputSchema = z.object({
  roomId: z.string().trim(),
  playerId: z.string().trim(),
  x: coordinateSchema,
  y: coordinateSchema,
  result: z.enum(["miss", "hit", "sunk"])
});

export const shipPlacementSchema = z.object({
  roomId: z.string().trim(),
  playerId: z.string().trim(),
  startX: coordinateSchema,
  startY: coordinateSchema,
  length: z.number().int().min(1).max(4),
  orientation: z.enum(["horizontal", "vertical"])
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(3).max(50),
  password: z.string().optional()
});

export type ShotInput = z.infer<typeof shotInputSchema>;
export type ShipPlacementInput = z.infer<typeof shipPlacementSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
