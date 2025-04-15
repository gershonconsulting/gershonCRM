import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash a password for secure storage
 * @param password Plain text password to hash
 * @returns Hashed password in the format hash.salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword Plain text password to check
 * @param hashedPassword Hashed password to compare against (in the format hash.salt)
 * @returns True if passwords match, false otherwise
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  const [hashedPart, salt] = hashedPassword.split('.');
  const hashBuffer = Buffer.from(hashedPart, 'hex');
  const derivedKey = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
  return hashBuffer.length === derivedKey.length && 
    Buffer.compare(hashBuffer, derivedKey) === 0;
}