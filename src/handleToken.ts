import fs from 'fs/promises';
import path from 'path';
import { safeStorage, app } from 'electron';

export async function encrypt(token: string) {
  const result = { tokenSaveOk: true }
  try {
    const encryptedToken = safeStorage.encryptString(token);
    const filepath = path.join(app.getPath('userData'), 'token.txt');
    await fs.writeFile(filepath, encryptedToken.toString('base64'), 'utf-8');
  } catch {
    result.tokenSaveOk = false;
  }
  return result;
}