import express from "express";
import { calculateWorkingDate } from "./controllers/workingDaysController";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_, res) => res.send("🚀 Working Days API is running"));
app.get("/calculate", calculateWorkingDate);

app.listen(PORT, () => {
  console.log(`✅ API disponible en http://localhost:${PORT}`);
});
