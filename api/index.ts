import type { Express, Request, Response } from "express";
import { createApp } from "../dist/server.js";

let app: Express | null = null;
let ready: Promise<void> | null = null;

function init() {
  if (!ready) {
    ready = createApp().then(({ app: created }) => {
      app = created;
    });
  }
  return ready;
}

export default async function handler(req: Request, res: Response) {
  await init();
  app!(req, res);
}