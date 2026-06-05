import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  photoUrl: string | null;
  role: "user" | "admin";
};

export type UserWithPassword = AuthUser & {
  passwordHash: string;
};

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function findUserById(id: number): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}

export async function findUserWithPasswordByEmail(
  email: string,
): Promise<UserWithPassword | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      passwordHash,
      role: "user",
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
    });

  return user;
}
