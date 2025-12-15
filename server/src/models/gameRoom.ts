import { Schema, model, Types } from "mongoose";

export type GameRoomStatus = "waiting" | "placing" | "playing" | "finished";

export interface IGameRoom {
  name: string;
  status: GameRoomStatus;
  maxPlayers: number;
  currentTurn: Types.ObjectId | null;
  winner: Types.ObjectId | null;
  password?: string;
  participants: Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameRoomSchema = new Schema<IGameRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    status: {
      type: String,
      enum: ["waiting", "placing", "playing", "finished"],
      default: "waiting",
      required: true
    },
    maxPlayers: {
      type: Number,
      default: 2,
      min: 2,
      max: 2
    },
    currentTurn: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    password: {
      type: String
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

gameRoomSchema.index({ name: 1 });
gameRoomSchema.index({ status: 1 });
gameRoomSchema.index({ isDeleted: 1 });

export const GameRoom = model<IGameRoom>("GameRoom", gameRoomSchema);
