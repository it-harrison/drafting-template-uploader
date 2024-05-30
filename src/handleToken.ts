import fs from 'fs/promises';
import { safeStorage } from 'electron';

export async function encrypt(token: string) {
  const result = { tokenSaveOk: true }
  try {
    const encryptedToken = safeStorage.encryptString(token);
    await fs.writeFile('src/token.txt', encryptedToken.toString('base64'), 'utf-8');
  } catch {
    result.tokenSaveOk = false;
  }
  return result;
}