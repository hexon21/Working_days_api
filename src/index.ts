import express from "express";
import dotenv from "dotenv";
import { calculateWorkingDate } from "./controllers/workingDaysController";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Definimos el endpoint principal
app.get("/calculate", calculateWorkingDate);

// Levantamos el servidor
app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});
