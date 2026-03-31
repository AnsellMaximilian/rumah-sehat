import "server-only";
import {
  getAuthSessionRepository,
  signInEmailRepository,
  signOutRepository,
  signUpEmailRepository,
} from "@/modules/auth/auth.repository";
import {
  AuthSession,
  SignInServiceInput,
  SignUpServiceInput,
} from "@/modules/auth/auth.types";
import { can, requirePermission } from "@/modules/auth/authorization.service";

export async function getAuthSessionService(): Promise<AuthSession | null> {
  const session = await getAuthSessionRepository();

  if (!session) {
    return null;
  }

  return {
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
      userId: session.session.userId,
    },
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image,
    },
  };
}

export async function requireAuthSessionService(): Promise<AuthSession> {
  const session = await getAuthSessionService();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function signInService(input: SignInServiceInput) {
  return signInEmailRepository({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    rememberMe: input.rememberMe,
    callbackURL: input.callbackURL,
  });
}

export async function signUpService(input: SignUpServiceInput) {
  return signUpEmailRepository({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    rememberMe: input.rememberMe,
    callbackURL: input.callbackURL,
  });
}

export async function signOutService() {
  return signOutRepository();
}

export async function getAuthContext() {
  const session = await requireAuthSessionService();

  return {
    user: session.user,
    can: (action: string, resource: string) =>
      can(session.user.id, action, resource),
    require: (action: string, resource: string) =>
      requirePermission(session.user.id, action, resource),
  };
}
