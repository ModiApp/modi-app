import express from "express";
import authenticate from "./authenticate";
import { createGame } from "./handlers/CreateGame";
import { makeRequestHandler } from "./handlers/makeHandler";

const app = express();


app.use(authenticate);
app.post('/games', makeRequestHandler(createGame));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
