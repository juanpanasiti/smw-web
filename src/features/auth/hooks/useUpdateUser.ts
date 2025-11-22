import { useMutation } from '@tanstack/react-query'
import { updateUser } from '@/lib/api/auth'
import type { UpdateUserData } from '@/lib/models/user'

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
  })
}
