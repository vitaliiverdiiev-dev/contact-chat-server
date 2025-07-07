import { WebSocketServer, WebSocket } from "ws";

type ServerToClientMessage =
  | { type: "assignClientId"; clientId: string }
  | { type: "reply"; message: string }
  | { type: "error"; message: string };

type ClientToServerMessage =
  | { type: "message"; message: string }
  | { type: "email"; email: string };

type Client = {
  id: string;
  socket: WebSocket;
};

const clients = new Map<string, Client>();

export let broadcastToClient: (clientId: string, message: string) => void;

export const startWebSocketServer = (port: number): void => {
  const wss = new WebSocketServer({ port });

  console.log(`[WebSocket] Server started on port ${port}`);

  wss.on("connection", (ws) => {
    let clientId: string | null = null;

    console.log(
      `[WebSocket] New client connected, awaiting email for identification...`
    );

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as ClientToServerMessage;

        if (!clientId) {
          if (data.type === "email" && validateEmail(data.email)) {
            clientId = data.email.toLowerCase();
            const client: Client = { id: clientId, socket: ws };
            clients.set(clientId, client);

            console.log(`[WebSocket] Client identified as: ${clientId}`);

            const assignIdMsg: ServerToClientMessage = {
              type: "assignClientId",
              clientId,
            };
            ws.send(JSON.stringify(assignIdMsg));
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  "Please send a valid email as your first message with type: 'email'.",
              })
            );
            ws.close();
          }
          return;
        }

        if (data.type === "message" && typeof data.message === "string") {
          console.log(`[Client ${clientId}]`, data.message);

          if (onMessageFromClient) {
            onMessageFromClient(clientId, data.message);
          }
        }
      } catch (e) {
        console.error("Invalid message format:", e);
      }
    });

    ws.on("close", () => {
      if (clientId) {
        clients.delete(clientId);
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
      }
    });
  });

  broadcastToClient = (clientId, message) => {
    const client = clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      const replyMsg: ServerToClientMessage = { type: "reply", message };
      client.socket.send(JSON.stringify(replyMsg));
    }
  };
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

let onMessageFromClient: (clientId: string, message: string) => void;

export const onClientMessage = (
  callback: (clientId: string, message: string) => void
) => {
  onMessageFromClient = callback;
};
