import { createContext } from 'react'
import type { User, SignInOptions } from './authService'

export interface AuthContextValue {
  user: User | null
  signIn: (email: string, otp: string, options?: SignInOptions) => Promise<User>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
