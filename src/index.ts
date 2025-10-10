import express from "express";
import cors from "cors";
import { calculateWorkingDate } from "./controllers/workingDaysController";

const app = express();

// ✅ Middleware base
app.use(cors());
app.use(express.json());

// ✅ Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("🚀 Working Days API está activa. Usa /calculate?hours=8 o /calculate?days=2");
});

// ✅ Endpoint principal
app.get("/calculate", calculateWorkingDate);

// ✅ Configuración de puerto (Render usa PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
