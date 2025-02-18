import { safeStorage, app } from 'electron';
import fsPromises from 'fs/promises'
import path from 'path';

const COLS = ['title', 'body', 'assignee', 'labels', 'milestone'];

export type ColIndices = {
  [key: string]: number
}

export type TokenType = {
  token: string | null
}

export async function getToken(): Promise<TokenType> {
  const result: TokenType = { token: null }
  try {
    const filepath = path.join(app.getPath('userData'), 'token.txt');
    const token = await fsPromises.readFile(filepath, 'utf-8');
    // const buffer = Buffer.from(encryptedToken, "base64");
    // const token = safeStorage.decryptString(buffer);
    result.token = token;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(error)
    }
  }
  return result
}

export function getIndices(cols: string[]): ColIndices {
  const indices: ColIndices = {};
  for (const _col of COLS) {
    indices[_col] = cols.findIndex(col => col === _col)
  }
  return indices;
}

export function parseLabels(labelString: string): string[] {
  return labelString.split(',').filter(label => label);
}

export function sleep(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}
