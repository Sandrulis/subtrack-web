/** Klienta (FS JS) forma – sakrīt ar `public/fs/js/dashboard.js` payload. */

export type SubscriptionDeviceClient = {
  id: number;
  name: string;
  note: string;
  amount: number;
  termStart: string;
  termEnd: string;
};

export type SubscriptionClient = {
  id: string;
  name: string;
  category: string;
  amount: number;
  period: string;
  date: string;
  icon: string | null;
  color: string | null;
  note: string;
  termStart: string;
  termEnd: string;
  devices: SubscriptionDeviceClient[];
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number | string;
  period: string;
  next_payment_date: string;
  icon: string | null;
  color: string | null;
  note: string | null;
  term_start: string | null;
  term_end: string | null;
  devices: unknown;
};
