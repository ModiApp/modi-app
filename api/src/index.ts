import 'dotenv/config';
import express from "express";
import authenticate from "./authenticate";
import { cors } from "./cors";
import { createGame } from "./handlers/CreateGame";
import { dealCards } from "./handlers/DealCards";
import { endRound } from "./handlers/EndRound";
import { joinGame } from "./handlers/JoinGame";
import { leaveGame } from "./handlers/LeaveGame";
import { playAgain } from "./handlers/PlayAgain";
import { setPlayerOrder } from "./handlers/SetPlayerOrder";
import { startGame } from "./handlers/StartGame";
import { stick } from "./handlers/Stick";
import { swapCard } from "./handlers/SwapCard";
import { makeRequestHandler } from "./handlers/makeHandler";
import { getLanIp } from "./utils/getLanIPAddress";

const app = express();

app.use(cors);
app.get('/', (req, res) => {
  res.send('Herro herro');
});

app.use(express.json());

app.use('/games', authenticate);
app.post('/games', makeRequestHandler(createGame));

// Cloud Functions parity
app.post('/games/:gameId/join', makeRequestHandler(joinGame));
app.post('/games/:gameId/start', makeRequestHandler(startGame));
app.post('/games/:gameId/deal', makeRequestHandler(dealCards));
app.post('/games/:gameId/end-round', makeRequestHandler(endRound));
app.post('/games/:gameId/leave', makeRequestHandler(leaveGame));
app.post('/games/:gameId/play-again', makeRequestHandler(playAgain));
app.post('/games/:gameId/set-player-order', makeRequestHandler(setPlayerOrder));
app.post('/games/:gameId/stick', makeRequestHandler(stick));
app.post('/games/:gameId/swap', makeRequestHandler(swapCard));

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

app.listen(port, host, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server is running on http://${getLanIp()}:${port}`);
  } else {
    console.log(`🚀 Server is running`);
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = typeof err.status === 'number' ? err.status : 500;
  const message = typeof err.message === 'string' ? err.message : 'Internal Server Error';
  res.status(status).send(message);
});
