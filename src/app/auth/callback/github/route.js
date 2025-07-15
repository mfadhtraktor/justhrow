import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { githubOAuth } from "@/lib/auth";
import {
  GITHUB_OAUTH_USER_EMAIL_INFO_URL,
  GITHUB_OAUTH_USER_INFO_URL,
  IS_PROD,
  SESSION_LIFETIME_IN_DAYS,
} from "@/lib/constant";
import { createSession } from "@/services/session";
import { createUser, getUserByEmail } from "@/services/user";

export async function GET(request) {
  const cookieStore = await cookies();

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const tokens = await githubOAuth.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const response = await fetch(GITHUB_OAUTH_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await response.json();

    const emailResponse = await fetch(GITHUB_OAUTH_USER_EMAIL_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const emailData = await emailResponse.json();
    const email = emailData.find(
      (email) => email.primary && email.verified,
    )?.email;

    if (!user.email || !email) {
      return NextResponse.redirect(
        new URL(
          "/auth/login?error=We couldn't find your email address from GitHub. Please make sure your email is public on your GitHub account and try again.",
          request.url,
        ),
      );
    }

    const existingUser = await getUserByEmail({ email: user.email ?? email });

    if (existingUser) {
      const session = await createSession({ userId: existingUser.id });
      cookieStore.set("session", session.id, {
        httpOnly: true,
        secure: IS_PROD,
        maxAge: 60 * 60 * 24 * SESSION_LIFETIME_IN_DAYS,
        path: "/",
      });
    } else {
      const newUser = await createUser({
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      });

      const session = await createSession({ userId: newUser.id });
      cookieStore.set("session", session.id, {
        httpOnly: true,
        secure: IS_PROD,
        maxAge: 60 * 60 * 24 * SESSION_LIFETIME_IN_DAYS,
        path: "/",
      });
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.log("[ERROR] Google Callback:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
