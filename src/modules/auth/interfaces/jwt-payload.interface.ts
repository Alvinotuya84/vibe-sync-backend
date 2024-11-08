export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
