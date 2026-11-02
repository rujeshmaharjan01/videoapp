import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "./auth";

export const getSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
};

export const requireAuth = async () => {
  const session = await getSession();

  if (!session || !isAdminEmail(session.user.email)) {
    redirect("/login");
  }

  return session;
};

export const requireUnauth = async () => {
  const session = await getSession();

  if (session && isAdminEmail(session.user.email)) {
    redirect("/videos");
  }
};
