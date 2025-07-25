"server-only";

import { cookies } from "next/headers";
import { SESSION_LIFETIME_IN_DAYS } from "@/lib/constant";
import { prisma } from "@/lib/db";

export async function getAllSessions({ userId }) {
  return await prisma.session.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getSession({ id }) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (!session) {
    return null;
  }

  return await getSession({ id: session.value });
}

export async function createSession({ userId }) {
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * SESSION_LIFETIME_IN_DAYS,
  );

  return await prisma.session.create({
    data: { userId, expiresAt },
  });
}

export async function deleteSession({ id }) {
  return await prisma.session.delete({
    where: { id },
  });
}
