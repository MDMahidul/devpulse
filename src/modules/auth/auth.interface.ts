export type UserRole = 'maintainer' | 'contributor';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}