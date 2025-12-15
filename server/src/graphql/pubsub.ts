import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();
export const MESSAGE_ADDED = "MESSAGE_ADDED";
export const SHOT_FIRED = "SHOT_FIRED";
export const ROOM_UPDATED = "ROOM_UPDATED";
