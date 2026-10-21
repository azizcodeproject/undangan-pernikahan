"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    redirect("/auth/sign-in?error=1");
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirect("/auth/sign-up?error=weak-password");
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    redirect("/auth/sign-up?error=1");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/");
}
