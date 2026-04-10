export interface UserProfile {
  id: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  isAdmin: boolean
  photoURL?: string
  createdAt: Date
}
