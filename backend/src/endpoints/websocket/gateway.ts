import { Injectable, Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { Server } from "socket.io";

@Injectable()
@WebSocketGateway(3099)
export class SolanaVerifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SolanaVerifyGateway.name);

  private clientNonceMap: Record<string, string> = {};

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log("Initialized");
  }

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);

    // Send a welcome message to the connected client
    this.io.to(client.id).emit("welcome", "Welcome to the WebSocket server!");
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client id: ${client.id} disconnected`);
    delete this.clientNonceMap[client.id];
  }

  @SubscribeMessage("live-check")
  liveCheck(client: any) {
    this.logger.log(`Live check received from client id: ${client.id}`);
    return {
      "message": "Live check received",
    };
  }

  @SubscribeMessage("getNonce")
  onEvent(client: any, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);

    const nonce = Math.random().toString(36).substring(7);
    const timestamp = Math.floor(Date.now() / 1000);
    const concat = nonce + timestamp + client.id;

    // Store the concat value associated with the client.id
    this.clientNonceMap[client.id] = concat;

    return {
      nonce: concat,
    };
  }

  @SubscribeMessage("verifySignature")
  async verifySignature(client: any, data: any) {
    this.logger.log(`Verification signature received from client id: ${client.id}`);

    const response = JSON.parse(data);

    this.logger.log(response);

    // verify signature

    // verify user has enough balance

    // Retrieve the stored concat value associated with the client.id
    const concat = this.clientNonceMap[client.id];

    // Verify the signature here using the received data.signature and concat

    // Process the information as needed

    // Optionally, you can emit a response back to the client
    this.io.to(client.id).emit("verificationSuccess", "Signature verified successfully");

    // Remove the client.id entry from the map after verification
    delete this.clientNonceMap[client.id];
  }
}
