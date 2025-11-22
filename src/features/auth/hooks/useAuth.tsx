"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login as loginService, register as registerService } from "@/lib/api/auth";
import { parseUserFromApi } from "@/lib/parsers/user";
import { useAuthContext } from "@/providers/AuthProvider";

export type LoginFormValues = {
  username: string;
  password: string;
};

export type RegisterFormValues = LoginFormValues & {
  email: string;
  firstName: string;
  lastName: string;
};

export function useLoginMutation() {
  const router = useRouter();
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: (credentials: LoginFormValues) => {
      return loginService({
        username: credentials.username,
        password: credentials.password,
        device_info: "smw_webapp",
      });
    },
    onSuccess(data) {
      const parsed = parseUserFromApi(data);
      login(parsed);
      router.push("/dashboard");
    },
  });
}

export function useRegisterMutation() {
  const router = useRouter();
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerService({
        username: values.username,
        password: values.password,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
      }),
    onSuccess(data) {
      const parsed = parseUserFromApi(data);
      login(parsed);
      router.push("/dashboard");
    },
  });
}