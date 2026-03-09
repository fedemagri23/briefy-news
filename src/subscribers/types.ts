export interface Subscriber {
  email: string;
}

export interface SubscriberRepository {
  getAll(): Promise<Subscriber[]>;
}