import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function login(user: string, password: string) {
  if (user !== process.env.AUTH_USER || password !== process.env.AUTH_PASSWORD) {
    return null;
  }

  const accessToken = jwt.sign({ sub: user }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

export function refresh(token: string) {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload;
  const accessToken = jwt.sign({ sub: payload.sub }, JWT_SECRET, { expiresIn: '15m' });
  return { accessToken };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
}
