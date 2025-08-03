import 'dotenv/config';
import express from "express";
import authenticate from "./authenticate";
import { cors } from "./cors";
import { createGame } from "./handlers/CreateGame";
import { makeRequestHandler } from "./handlers/makeHandler";

const app = express();

app.use(express.json());
app.use(cors);


app.use('/games', authenticate);

app.post('/games', makeRequestHandler(createGame));

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

app.listen(port, host, () => {
  console.log(`🚀 Server is running on http://${host}:${port}`);
});
