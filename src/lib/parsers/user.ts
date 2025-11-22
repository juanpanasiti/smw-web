import type { ApiLoggedInUser } from "@/lib/api/auth";
import type { User, Profile, Preferences, UpdateUserData } from "@/lib/models/user";

interface PreferencesDTO {
  id?: string;
  monthly_spending_limit: number | null;
}

interface ProfileDTO {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  birthdate: string | null;
  preferences: PreferencesDTO | null;
}

interface UserResponseDTO {
  id: string;
  username: string;
  email: string;
  role: string;
  profile: ProfileDTO | null;
}

function parsePreferencesFromApi(dto: PreferencesDTO | null): Preferences | null {
  if (!dto) return null;
  return {
    monthlySpendingLimit: dto.monthly_spending_limit,
  };
}

function parseProfileFromApi(dto: ProfileDTO | null): Profile | null {
  if (!dto) return null;
  return {
    firstName: dto.first_name,
    lastName: dto.last_name,
    birthdate: dto.birthdate,
    preferences: parsePreferencesFromApi(dto.preferences),
  };
}

export function parseUserFromApi(apiUser: ApiLoggedInUser): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    role: apiUser.role,
    accessToken: apiUser.access_token ?? "",
    refreshToken: apiUser.refresh_token ?? "",
    tokenType: apiUser.token_type ?? "bearer",
  };
}

export function parseUserResponseFromApi(dto: UserResponseDTO): Omit<User, 'accessToken' | 'refreshToken' | 'tokenType'> {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    role: dto.role as User['role'],
    profile: parseProfileFromApi(dto.profile),
  };
}

export function serializeUpdateUserData(data: UpdateUserData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  if (data.username !== undefined) result.username = data.username;
  if (data.email !== undefined) result.email = data.email;
  if (data.password !== undefined) result.password = data.password;
  
  if (data.profile !== undefined) {
    const profile: Record<string, unknown> = {};
    
    if (data.profile?.firstName !== undefined) profile.first_name = data.profile.firstName;
    if (data.profile?.lastName !== undefined) profile.last_name = data.profile.lastName;
    if (data.profile?.birthdate !== undefined) profile.birthdate = data.profile.birthdate;
    
    if (data.profile?.preferences !== undefined) {
      const preferences: Record<string, unknown> = {};
      if (data.profile.preferences?.monthlySpendingLimit !== undefined) {
        preferences.monthly_spending_limit = data.profile.preferences.monthlySpendingLimit;
      }
      profile.preferences = preferences;
    }
    
    result.profile = profile;
  }
  
  return result;
}
