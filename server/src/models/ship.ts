import { Schema, model, Types } from "mongoose";

export type ShipOrientation = "horizontal" | "vertical";

export interface IShip {
  playerId: Types.ObjectId;
  roomId: Types.ObjectId;
  startX: number;
  startY: number;
  length: number;
  orientation: ShipOrientation;
  hits: number;
  createdAt: Date;
  updatedAt: Date;
}

const shipSchema = new Schema<IShip>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "GameRoom",
      required: true
    },
    startX: {
      type: Number,
      min: 0,
      max: 9,
      required: true
    },
    startY: {
      type: Number,
      min: 0,
      max: 9,
      required: true
    },
    length: {
      type: Number,
      min: 1,
      max: 4,
      required: true
    },
    orientation: {
      type: String,
      enum: ["horizontal", "vertical"],
      required: true
    },
    hits: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

shipSchema.index({ roomId: 1, playerId: 1 });

export const Ship = model<IShip>("Ship", shipSchema);
