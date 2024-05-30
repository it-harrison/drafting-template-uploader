import { parseFile } from "./parse";
import { createIssues, CreateIssuesResult } from "./tickets";

type UploadResult = Partial<CreateIssuesResult> & {
  parseOk: boolean
}

export async function handleUpload(filepath: string): Promise<UploadResult> {
  const { parseOk, tickets } = await parseFile(filepath);

  let result: UploadResult = {
    parseOk
  }
  
  if (parseOk) {
    const createIssuesResult = await createIssues(tickets);
    result = { ...createIssuesResult, ...result };
  }

  return result;
}
