import { config } from "../config/index.js";
import type { SubscriberRepository, Subscriber } from "./types.js";

export class ConfigSubscriberRepository implements SubscriberRepository {
  async getAll(): Promise<Subscriber[]> {
    return config.subscribers.map((email) => ({ email }));
  }
}