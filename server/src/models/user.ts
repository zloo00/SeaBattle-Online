import { Schema, model, Types } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  avatarUrl?: string;
  participantRooms: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    wins: {
      type: Number,
      default: 0,
      min: 0
    },
    losses: {
      type: Number,
      default: 0,
      min: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0
    },
    avatarUrl: {
      type: String
    },
    participantRooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "GameRoom"
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = model<IUser>("User", userSchema);
