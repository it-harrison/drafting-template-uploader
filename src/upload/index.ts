import { BrowserWindow } from 'electron';
import { parseFile } from "./parse";
import { createIssues, CreateIssuesResult } from "./tickets";
import { generateSummary } from "./generate-summary";

type UploadResult = Partial<CreateIssuesResult> & {
  parseOk: boolean
  error?: string | null
  slackMessage?: string
}

export async function handleUpload(filepath: string, dst: boolean, browserWindow: BrowserWindow): Promise<UploadResult> {
  const { parseOk, error, tickets } = await parseFile(filepath);

  let result: UploadResult = { parseOk, error }
  if (parseOk) {
    const createIssuesResult = await createIssues(tickets, dst, browserWindow);
    const slackMessage = await generateSummary(tickets, dst, createIssuesResult.milestone);
    result = { ...createIssuesResult, ...result, slackMessage };
  }
  return result;
}
