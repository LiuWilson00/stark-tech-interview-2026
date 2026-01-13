export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
