import { AxiosInstance } from "axios";
import {
  getIndices,
  getAxiosInstance,
  ColIndices,
  parseLabels
} from "./utilities";

export type CreateIssuesResult = ErrorData & {
  createIssuesOk: boolean;
  failedIssues?: string[];
  totalCreated?: number;
  noToken?: boolean;
};

type ErrorData = {
  failedIssues?: string[];
  badcreds?: boolean;
};

let _axiosInstance: AxiosInstance | null = null;

export async function createIssues(
  tickets: string[][]
): Promise<CreateIssuesResult> {
  const [headers, ...rows] = tickets;
  const indices = getIndices(headers);

  const { axiosInstance, noToken } = await getAxiosInstance();
  if (axiosInstance === null) {
    // could not load token so cannot hit api
    return {
      createIssuesOk: false,
      noToken
    }
  }

  // we can hit the api
  _axiosInstance = axiosInstance;
  const errorData: ErrorData = {
    failedIssues: [],
    badcreds: false,
  };
  // trade parallelization for greater reliability
  for (const row of rows) {
    await createIssue(row, indices, errorData);
  }
  return {
    createIssuesOk: errorData.failedIssues.length < tickets.length - 1,
    totalCreated: tickets.length - 1 - errorData.failedIssues.length,
    ...errorData,
  };
}

async function createIssue(ticketData: string[], indices: ColIndices, errorData: ErrorData
): Promise<void> {
  try {
    const payload = getPayload(ticketData, indices)
    await _axiosInstance.post("", payload);
  } catch (error) {
    const { response: { status, data: { message } },
    } = error;
    if (status === 401 && message === "Bad credentials") {
      errorData.badcreds = true;
    }

    errorData.failedIssues.push(ticketData[indices.title]);
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