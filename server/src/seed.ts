import { connectToDatabase } from "./config/db";
import { User } from "./models/user";
import { GameRoom } from "./models/gameRoom";
import { Ship } from "./models/ship";
import { Shot } from "./models/shot";
import { Message } from "./models/message";
import { hashPassword } from "./auth/password";
import { ShipPlacementInput } from "./validation/gameSchemas";

const demoFleet: ShipPlacementInput[] = [
  { startX: 0, startY: 0, length: 4, orientation: "horizontal" },
  { startX: 0, startY: 2, length: 3, orientation: "horizontal" },
  { startX: 0, startY: 4, length: 3, orientation: "horizontal" },
  { startX: 5, startY: 0, length: 2, orientation: "vertical" },
  { startX: 7, startY: 0, length: 2, orientation: "vertical" },
  { startX: 9, startY: 0, length: 2, orientation: "vertical" },
  { startX: 5, startY: 5, length: 1, orientation: "horizontal" },
  { startX: 7, startY: 5, length: 1, orientation: "horizontal" },
  { startX: 9, startY: 5, length: 1, orientation: "horizontal" },
  { startX: 5, startY: 9, length: 1, orientation: "horizontal" }
];

const buildFleet = (playerId: string, roomId: string) =>
  demoFleet.map((ship) => ({
    ...ship,
    playerId,
    roomId,
    hits: 0
  }));

const seed = async () => {
  await connectToDatabase();

  const [alice, bob] = await Promise.all([
    User.findOne({ email: "alice@example.com" }).then(async (existing) => {
      if (existing) return existing;
      return User.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: await hashPassword("password123"),
        wins: 0,
        losses: 0,
        gamesPlayed: 0
      });
    }),
    User.findOne({ email: "bob@example.com" }).then(async (existing) => {
      if (existing) return existing;
      return User.create({
        username: "bob",
        email: "bob@example.com",
        passwordHash: await hashPassword("password123"),
        wins: 0,
        losses: 0,
        gamesPlayed: 0
      });
    })
  ]);

  const room = await GameRoom.findOneAndUpdate(
    { name: "Demo Room" },
    {
      name: "Demo Room",
      status: "playing",
      maxPlayers: 2,
      participants: [alice._id, bob._id],
      currentTurn: alice._id,
      isDeleted: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    Ship.deleteMany({ roomId: room._id }),
    Shot.deleteMany({ roomId: room._id }),
    Message.deleteMany({ roomId: room._id })
  ]);

  await Ship.insertMany([
    ...buildFleet(alice._id.toString(), room._id.toString()),
    ...buildFleet(bob._id.toString(), room._id.toString())
  ]);

  await Message.create([
    {
      roomId: room._id,
      userId: alice._id,
      username: alice.username,
      text: "Удачи в бою!",
      timestamp: new Date()
    },
    {
      roomId: room._id,
      userId: bob._id,
      username: bob.username,
      text: "Готов начать!",
      timestamp: new Date()
    }
  ]);

  console.log("Seed complete. Users:");
  console.log("- alice@example.com / password123");
  console.log("- bob@example.com / password123");
  console.log(`Demo room id: ${room._id.toString()}`);
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
