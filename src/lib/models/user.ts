export type UserRole = "admin" | "free_user" | "premium_user" | "test_user";

export interface Preferences {
  monthlySpendingLimit: number | null;
}

export interface Profile {
  firstName: string | null;
  lastName: string | null;
  birthdate: string | null;
  preferences: Preferences | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  profile?: Profile | null;
}

export interface UpdateUserData {
  username?: string | null;
  email?: string | null;
  password?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    birthdate?: string | null;
    preferences?: {
      monthlySpendingLimit?: number | null;
    } | null;
  } | null;
}
