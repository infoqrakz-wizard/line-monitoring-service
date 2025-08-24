import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import {
  servers,
  problems,
  addServer,
  updateServer,
  removeServer,
} from "./data";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---- REST ----
app.get("/api/problems", (req, res) => {
  const status = String(req.query.status || "");
  const list = status ? problems.filter((p) => p.status === status) : problems;
  setTimeout(() => res.json(list), 200); // лёгкая задержка
});

app.get("/api/servers", (_req, res) => res.json(servers));

app.post("/api/servers", (req, res) => {
  const item = addServer(req.body);
  res.status(201).json(item);
});

app.put("/api/servers/:id", (req, res) => {
  const item = updateServer(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: "not found" });
  res.json(item);
});

app.delete("/api/servers/:id", (req, res) => {
  removeServer(req.params.id);
  res.json({ ok: true });
});

// ---- HTTP + WS ----
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) ws.send(JSON.stringify({ type: "error", message: "no token" }));
  ws.send(JSON.stringify({ type: "welcome", ts: Date.now() }));

  const timer = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: "problem_update",
          payload: {
            id: "p1",
            severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            ts: Date.now(),
          },
        }),
      );
    }
  }, 5000);

  ws.on("message", (msg) => {
    ws.send(JSON.stringify({ type: "echo", data: msg.toString() }));
  });
  ws.on("close", () => clearInterval(timer));
});

server.listen(PORT, () => {
  console.log(`REST: http://localhost:${PORT}/api`);
  console.log(`WS:   ws://localhost:${PORT}/ws`);
});
