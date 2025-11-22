import type { AxiosResponse } from "axios";
import apiClient from "@/lib/api/client";
import type { UserRole } from "@/lib/models/user";
import { parseUserResponseFromApi, serializeUpdateUserData } from "../parsers/user";
import type { User, UpdateUserData } from "../models/user";

export interface ApiLoggedInUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  device_info?: string | null;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

async function extractLoggedInUser(response: AxiosResponse): Promise<ApiLoggedInUser> {
  return response.data;
}

export async function login(payload: LoginPayload): Promise<ApiLoggedInUser> {
  const response = await apiClient.post<ApiLoggedInUser>("/api/v3/auth/login", payload);
  return extractLoggedInUser(response);
}

export async function register(payload: RegisterPayload): Promise<ApiLoggedInUser> {
  const response = await apiClient.post<ApiLoggedInUser>("/api/v3/auth/register", payload);
  return extractLoggedInUser(response);
}

export async function getCurrentUser(): Promise<Omit<User, 'accessToken' | 'refreshToken' | 'tokenType'>> {
  const response = await apiClient.get("/api/v3/users/me");
  return parseUserResponseFromApi(response.data);
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<Omit<User, 'accessToken' | 'refreshToken' | 'tokenType'>> {
  const response = await apiClient.put(`/api/v3/users/${userId}`, serializeUpdateUserData(data));
  return parseUserResponseFromApi(response.data);
}
