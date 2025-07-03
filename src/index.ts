import dotenv from "dotenv";
dotenv.config();

import { startWebSocketServer } from "./websocket";
import { initTelegramBot } from "./telegram";

const port = Number(process.env.PORT || 3001);

startWebSocketServer(port);
initTelegramBot();
