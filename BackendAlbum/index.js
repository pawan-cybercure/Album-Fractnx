import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import albumRouter from "./routers/album.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", albumRouter);

app.get("/", (req, res) => {
  res.send({ message: "APP API Working" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
