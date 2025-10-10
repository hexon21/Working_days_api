import express from "express";
import cors from "cors";
import { calculateWorkingDate } from "./controllers/workingDaysController";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Endpoint principal
app.get("/calculate", calculateWorkingDate);

// ✅ Endpoint raíz opcional
app.get("/", (_, res) => {
  res.send("API de cálculo de días laborales activa ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
