import axios, { AxiosInstance } from 'axios'
import { safeStorage, app } from 'electron';
import fsPromises from 'fs/promises'
import path from 'path';

const COLS = ['title', 'body', 'assignee', 'labels', 'milestone'];

export type ColIndices = {
  [key: string]: number
}

export type AxiosType = {
  axiosInstance: AxiosInstance | null
  noToken: boolean
}

export async function getAxiosInstance(dst: boolean): Promise<AxiosType> {
  const result: AxiosType = {
    axiosInstance: null,
    noToken: false
  }
  try {
    const repo = dst ? 'vets-design-system-documentation' : 'va.gov-team';
    const baseURL = `https://api.github.com/repos/department-of-veterans-affairs/${repo}/issues`;
    const filepath = path.join(app.getPath('userData'), 'token.txt');
    const encryptedToken = await fsPromises.readFile(filepath, 'utf-8');
    const buffer = Buffer.from(encryptedToken, "base64");
    const token = safeStorage.decryptString(buffer);
    const instance = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    result.axiosInstance = instance;
  } catch (error) {
    if (error.code === 'ENOENT') {
      result.noToken = true;
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
