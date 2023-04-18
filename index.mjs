import { config } from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { run, findOnePartyByName, updateOnePartyByName } from './mongo.mjs';
import { MongoClient, ServerApiVersion } from 'mongodb';
config()

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

run(client).catch(console.dir);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '/public')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// active connections
const clients = {};
// active users
const users = {};
// bagContent
let bagContent = await findOnePartyByName(client, "Qora & The Aliens"); // TODO: update this when supporting future parties
// user activity history
let userActivity = [];

const USER_EVENT = 'USER_EVENT';
const CONTENT_EVENT = 'CONTENT_EVENT';

function broadcastMessage(json) {
  const data = JSON.stringify(json);
  for(let userId in clients) {
    const singleClient = clients[userId];
    if(singleClient.readyState === WebSocket.OPEN) {
      singleClient.send(data)
    }
  }
}

function handleMessage(message, userId) {
  const payload = JSON.parse(message.toString());
  const json = { type: payload.type };
  if (payload.type === USER_EVENT) {
    
    // log new user and any user activity
    users[userId] = payload;
    
    /* if you are the first user
        - clear out the userActivity
        - get the party information from MongoDB
    */
    const isFirstUser = Object.keys(users)?.length === 1;
    if (isFirstUser) { 
      userActivity = [];
    }

    broadcastMessage({ type: CONTENT_EVENT, data: { bagContent } });
    userActivity.unshift(`${payload.username} joined the party.`);
    json.data = { users, userActivity };

  } else if (payload.type === CONTENT_EVENT) {
    const { content } = payload;
    bagContent = { ...bagContent, ...content };
    json.data = { bagContent, userActivity }
  }
  broadcastMessage(json);
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`);
  
  const json = { type: USER_EVENT };
  const username = users[userId]?.username || userId;

  userActivity.unshift(`${username} left the party.`);
  json.data = { users, userActivity };

  delete clients[userId];
  delete users[userId];

  broadcastMessage(json);
  updateOnePartyByName(client, "Qora & The Aliens", bagContent);
}

// new client connection request received
wss.on("connection", function connection(ws) {
  // generate unique user id
  const userId = uuidv4();

  // store new user's ws connection
  clients[userId] = ws;
  console.log(`${userId} connected.`);

  ws.on("message", (message) => handleMessage(message, userId));
  ws.on('close', () => handleDisconnect(userId));
});