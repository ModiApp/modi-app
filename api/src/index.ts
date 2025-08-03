import express from "express";
import authenticate from "./authenticate";
import { createGame } from "./handlers/CreateGame";
import { makeRequestHandler } from "./handlers/makeHandler";

const app = express();

app.use(express.json());

// CORS middleware to handle preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use('/games', authenticate);

app.post('/games', makeRequestHandler(createGame));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
