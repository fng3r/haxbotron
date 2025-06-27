import { SignJWT, jwtVerify } from 'jose';

const JWS_ALGORITHM = 'HS256';

export async function generateToken(username: string): Promise<string> {
  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
  const payload = { username };
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: JWS_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWS_ALGORITHM],
    });
    return payload as { username: string };
  } catch (error: any) {
    console.error('JWT verification failed:', error.message);

    return null;
  }
}
