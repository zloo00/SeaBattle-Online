import { Schema, model, Types } from "mongoose";

export type ShotResult = "miss" | "hit" | "sunk";

export interface IShot {
  playerId: Types.ObjectId;
  roomId: Types.ObjectId;
  x: number;
  y: number;
  result: ShotResult;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shotSchema = new Schema<IShot>(
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
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 9
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 9
    },
    result: {
      type: String,
      enum: ["miss", "hit", "sunk"],
      required: true
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      required: true
    }
  },
  {
    timestamps: true
  }
);

shotSchema.index({ roomId: 1, playerId: 1, x: 1, y: 1 }, { unique: true });

export const Shot = model<IShot>("Shot", shotSchema);
