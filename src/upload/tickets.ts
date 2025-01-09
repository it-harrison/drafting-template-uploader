import https from 'https';
import { BrowserWindow, net } from 'electron';
import axios from 'axios';

import {
  getIndices,
  ColIndices,
  parseLabels,
  sleep,
  getToken,
  TokenType
} from "./utilities";

export type CreateIssuesResult = ErrorData & {
  createIssuesOk: boolean;
  failedIssues?: string[];
  totalCreated?: number;
  noToken?: boolean;
  milestone?: string;
};

type ErrorData = {
  failedIssues?: string[];
  badcreds?: boolean;
};

const SECONDS = 60;
const RATE_MAX = 20;

export async function createIssues(
  tickets: string[][],
  dst: boolean,
  browserWindow: BrowserWindow
): Promise<CreateIssuesResult> {
  const [headers, ...rows] = tickets;
  const indices = getIndices(headers);

  const { token }: TokenType = await getToken();
  if (token === null) {
    return {
      createIssuesOk: false,
      noToken: true
    }
  }

  // we can hit the api
  const errorData: ErrorData = {
    failedIssues: [],
    badcreds: false,
  };

  // trade parallelization for reliability
  let ctr = 0;
  for (const row of rows) {
    if (ctr % RATE_MAX === 0 && ctr >= RATE_MAX) {
      browserWindow.webContents.send('sleep-start', SECONDS);
      await sleep(SECONDS * 1000 + 1000);
    }
    await createIssue(token, dst, row, indices, errorData);
    browserWindow.webContents.send('upload-progress', {current: ctr + 1, total: rows.length})
    ctr++;
  }

  return {
    createIssuesOk: errorData.failedIssues.length < tickets.length - 1,
    totalCreated: tickets.length - 1 - errorData.failedIssues.length,
    ...errorData,
    milestone: tickets[1][indices.milestone]
  };
}

function formatError( error: any ): string {
  let moreInfo = '';
  const { errors } = error.response.data;
  if (errors && errors.length > 0) {
    moreInfo = '- ' + errors.map(function ({ field, value, code }: any) {
      return `problem with the ${field} field: '${value}' is ${code}`;
    }).join('-');
  }
  return moreInfo;
}

async function createIssue(token: string, dst: boolean, ticketData: string[], indices: ColIndices, errorData: ErrorData
): Promise<void> {
  try {
    const payload = getPayload(ticketData, indices);
    await makereq(token, dst, payload);
  } catch (error) {
    const { status, message } = error;
    if (status === "401" && message === "Bad credentials") {
      errorData.badcreds = true;
    }
    let moreInfo;
    if (status === 422) {
      moreInfo = formatError(error);
    }

    const failMessage = `${ticketData[indices.title]} - ${status}/${message} ${moreInfo}`;
    errorData.failedIssues.push(failMessage);
  }
}

function getPayload(ticketData: string[], indices: ColIndices) {
  return {
    title: ticketData[indices.title],
    body: ticketData[indices.body],
    assignee: ticketData[indices.assignee],
    labels: parseLabels(ticketData[indices.labels]),
    milestone: ticketData[indices.milestone],
  };
}

async function makereq(token: string, dst: boolean, payload: any): Promise<void> {
  const repo = dst ? 'vets-design-system-documentation' : 'va.gov-team';
  const URL  = `https://api.github.com/repos/department-of-veterans-affairs/${repo}/issues`;
  await axios.post(URL, payload, { 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
}
