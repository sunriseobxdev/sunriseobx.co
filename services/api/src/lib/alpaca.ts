import { AlpacaClient } from "@alpaca/ts-sdk";

let client: AlpacaClient | null = null;

export function getAlpacaClient(): AlpacaClient {
  if (!client) {
    client = new AlpacaClient({
      keyId: process.env.APCA_API_KEY_ID!,
      secretKey: process.env.APCA_API_SECRET_KEY!,
      baseUrl:
        process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
      paper: true,
    });
  }
  return client;
}
