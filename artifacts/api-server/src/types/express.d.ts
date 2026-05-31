declare global {
  namespace Express {
    interface User {
      id: number;
      discordId: string;
      username: string;
      displayName: string;
      avatar: string | null;
      role: string;
      isMember: boolean;
      createdAt: Date;
    }
  }
}

export {};
