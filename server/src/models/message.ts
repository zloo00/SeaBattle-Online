import { Schema, model, Types } from "mongoose";

export interface IMessage {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "GameRoom",
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
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

messageSchema.index({ roomId: 1, timestamp: -1 });

export const Message = model<IMessage>("Message", messageSchema);
