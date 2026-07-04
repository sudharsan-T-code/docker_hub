import express from "express";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import authRouter from "./routes/auth";
import repoRouter from "./routes/repositories";
import orgRouter from "./routes/organizations";
import registryRouter from "./routes/registry";
import notificationsRouter from "./routes/notifications";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*", // Adjust for production
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/repositories", repoRouter);
app.use("/api/orgs", orgRouter);
app.use("/api/notifications", notificationsRouter);

// OCI Registry Simulation Endpoint
app.use("/v2", registryRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server for live activity streaming
const wss = new WebSocketServer({ noServer: true });

// Track active connections
const clients = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  console.log("WebSocket client connected. Total clients:", clients.size);

  // Send a welcome message
  ws.send(JSON.stringify({
    type: "WELCOME",
    message: "Connected to Docker Hub live stream.",
    timestamp: new Date()
  }));

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected. Total clients:", clients.size);
  });
});

// Upgrade HTTP server to WebSockets for /ws path
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Broadcast messages to all connected WebSockets
function broadcast(data: any) {
  const messageStr = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Background simulation: push live Docker actions (pulls, pushes, scans)
const namespaces = ["library", "bitnami", "circleci", "john_doe", "alex_dev", "acme_inc"];
const images = ["nginx", "ubuntu", "redis", "alpine", "postgres", "node", "wordpress", "runner", "custom-website", "mysql"];
const tags = ["latest", "alpine", "slim", "1.0.0", "12-alpine", "22.04"];
const actions = ["PULL", "PUSH_START", "PUSH_LAYER", "PUSH_COMPLETE", "SCAN_START", "SCAN_CLEAN", "SCAN_VULN"];

setInterval(() => {
  if (clients.size === 0) return;

  const randomNamespace = namespaces[Math.floor(Math.random() * namespaces.length)];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  const randomTag = tags[Math.floor(Math.random() * tags.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];

  let message = "";
  let payload: any = {
    namespace: randomNamespace,
    image: randomImage,
    tag: randomTag,
    action,
    timestamp: new Date()
  };

  switch (action) {
    case "PULL":
      message = `docker pull ${randomNamespace}/${randomImage}:${randomTag}`;
      break;
    case "PUSH_START":
      message = `docker push ${randomNamespace}/${randomImage}:${randomTag} - Initializing upload`;
      break;
    case "PUSH_LAYER":
      const layerNum = Math.floor(Math.random() * 5) + 1;
      message = `docker push ${randomNamespace}/${randomImage}:${randomTag} - Layer ${layerNum}/5 uploaded`;
      payload.progress = Math.floor(Math.random() * 100);
      break;
    case "PUSH_COMPLETE":
      message = `docker push ${randomNamespace}/${randomImage}:${randomTag} - Push completed successfully!`;
      break;
    case "SCAN_START":
      message = `Security scanner: analyzing layers for ${randomNamespace}/${randomImage}:${randomTag}`;
      break;
    case "SCAN_CLEAN":
      message = `Security scan clean: 0 vulnerabilities found in ${randomNamespace}/${randomImage}:${randomTag}`;
      break;
    case "SCAN_VULN":
      const count = Math.floor(Math.random() * 4) + 1;
      message = `Security scan warning: ${count} medium/low vulnerabilities found in ${randomNamespace}/${randomImage}:${randomTag}`;
      payload.vulnerabilitiesCount = count;
      break;
  }

  payload.message = message;
  broadcast({
    type: "ACTIVITY",
    data: payload
  });
}, 7000); // Send a mock log event every 7 seconds

// Start Server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
