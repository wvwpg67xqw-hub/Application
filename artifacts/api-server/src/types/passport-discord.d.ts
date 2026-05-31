declare module "passport-discord" {
  import { Strategy as PassportStrategy } from "passport";

  interface Profile {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string;
    avatar?: string;
    email?: string;
    verified?: boolean;
    guilds?: Guild[];
  }

  interface Guild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: number;
  }

  interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  }

  type VerifyCallback = (err: Error | null, user?: any, info?: any) => void;
  type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void;

  class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
    authenticate(req: any, options?: any): void;
  }
}
