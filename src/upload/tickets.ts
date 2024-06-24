import https from 'https';
import { BrowserWindow, net } from 'electron';

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

async function createIssue(token: string, dst: boolean, ticketData: string[], indices: ColIndices, errorData: ErrorData
): Promise<void> {
  try {
    const payload = getPayload(ticketData, indices);
    await makereq(token, dst, payload);
  } catch (error) {
    const { status, message, moreInfo } = error;
    console.log(status, message)
    if (status === "401" && message === "Bad credentials") {
      errorData.badcreds = true;
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

function makereq(token: string, dst: boolean, payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const repo = dst ? 'vets-design-system-documentation' : 'va.gov-team';
    const req = net.request({
      method: 'POST',
      protocol: 'https:',
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/department-of-veterans-affairs/${repo}/issues`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js/https'
      },
    });

  
    req.on('response', (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        const parsedBody = JSON.parse(body);
        if (response.statusCode < 200 || response.statusCode >= 300) {
          let moreInfo = '';
          if (parsedBody.errors && parsedBody.errors.length > 0) {
            moreInfo = '- ' + parsedBody.errors.map(function ({ field, value, code }: any) {
              return `problem with the ${field} field: '${value}' is ${code}`;
            }).join('-');
          }
          reject({ status: parsedBody.status, message: parsedBody.message, moreInfo });
        } else {
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(payload));
    req.end();
  })
  
}

function makeRequest(token: string, dst: boolean, payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const repo = dst ? 'vets-design-system-documentation' : 'va.gov-team';

    const options = {
      host: 'api.github.com',
      port: 443,
      path: `/repos/department-of-veterans-affairs/${repo}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js/https'
      }
    }
  
    const req = https.request(options, (res) => {
      let responseBody = '';
  
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
  
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject({status: res.statusCode, message: res.statusMessage});
        } else {
          resolve();
        }
      });
    });
  
    req.on('error', (e) => {
      reject(e);
    });
  
    req.write(JSON.stringify(payload));
    req.end();
  })
}
