import { BrowserWindow } from 'electron';
import { parseFile } from "./parse";
import { createIssues, CreateIssuesResult } from "./tickets";

type UploadResult = Partial<CreateIssuesResult> & {
  parseOk: boolean
  error?: string | null
}

export async function handleUpload(filepath: string, dst: boolean, browserWindow: BrowserWindow): Promise<UploadResult> {
  const { parseOk, error, tickets } = await parseFile(filepath);

  let result: UploadResult = { parseOk, error }
  if (parseOk) {
    const createIssuesResult = await createIssues(tickets, dst, browserWindow);
    result = { ...createIssuesResult, ...result };
  }

  return result;
}
