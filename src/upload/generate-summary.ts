import axios from 'axios'
import { 
  getToken,
  TokenType,
  getIndices,
} from "./utilities";

const TICKET_STRINGS = {
  teamName: "### VFS team name",
  productName: "### Product name",
  featureName: "### Feature name",
  labelText: "### GitHub label for",
};

let OBJ: { [key: string]: number };
const PRACTICE_AREAS = ["accessibility", "design", "ia", "content"];

function practiceAreaSummaryText() {
  let text = 'There are 0 launch-blocking issues.';
  if (Object.keys(OBJ).length) {
    const howMany = Object.values(OBJ).reduce((acc, curr) => acc + curr, 0) > 1;
    text = `There ${howMany ? "are" : "is"} `;
    const entries = Object.entries(OBJ);
    for (let i = 0; i < entries.length; i++) {
      const [practiceArea, count] = entries[i];
      const _and = i === entries.length - 1 && i > 1 ? 'and ' : '';
      text += `${_and}${count} ${practiceArea}, `;
    }
    text = text.slice(0, text.length - 2) + ` launch-blocking issue${howMany ? 's' : ''} and ${howMany ? "they" : "it"} will be covered first.`;
  }
  return text;
}

function isLaunchBlocking(labels: string[]) {
  return labels.some(label => label === 'launch-blocking');
}

function handleTickets(tickets: string[][]) {
  const [headers, ...rows] = tickets;
  const indices = getIndices(headers);
  for (const ticket of rows) {
    const labels = ticket[indices.labels].split(',');
    if (isLaunchBlocking(labels)) {
      const area = getPracticeArea(labels);
      updateObj(area);
    }
  }
}

async function getTeamProdInfo(milestone: string, dst: boolean) {
  let teamProd = 'Team Name - Product Name';
  try {
      const ccTicket = await getTicket(milestone, dst, 'CC-Request');
    if (ccTicket !== null) {
      teamProd = dst
        ? ccTicket.title.replace(/staging review/i, '')
        : getTeamNameAndProductName(ccTicket.body);
    }
  } catch (error) {
    // let fail
  }
  return teamProd;
}

async function getQAInfo(milestone: string, dst: boolean) {
  let result;
  try {
    result = 'there are 0 launch-blocking issues.';
    const qaTicket = await getTicket(milestone, dst, 'QA,launch-blocking');
    if (qaTicket !== null) {
      result = 'there is at least 1 launch-blocking issue.';
    }
  } catch (error) {
    result = 'there is ? launch-blocking issue(s).';
  }
  return result;
}

async function getTicket(milestone: string, dst: boolean, labels: string) {
  const { token }: TokenType = await getToken();
  const repo = dst ? 'vets-design-system-documentation' : 'va.gov-team';
  const URL = `https://api.github.com/repos/department-of-veterans-affairs/${repo}/issues`;
  const { data: tickets } = await axios.get(URL, {
    params: {
      labels,
      milestone
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    }
  });
  if (tickets.length > 0) {
    return tickets[0];
  }
  return null;
}

export async function generateSummary(tickets: string[][], dst: boolean, milestone: string) {
  OBJ = {};
  handleTickets(tickets);
  const [teamProd, qaInfo] = await Promise.all([getTeamProdInfo(milestone, dst), getQAInfo(milestone, dst)]);
  const howMany = tickets.length - 1 > 1;
  const slackMessage = `
  @platform-governance-team-members We created ${tickets.length - 1} VA.gov Experience Standards issue${howMany ? 's' : ''} for the ${teamProd} Staging Review. ${howMany ? 'They have' : 'It has'} been added to the milestone. ${practiceAreaSummaryText()} For QA, ${qaInfo}

  Please find your issues and familiarize yourself with them so you are prepared to discuss them in the meeting. If you still need to upload images or video for your findings, please do so now.`;
  return slackMessage;
}

function getPracticeArea(labels: string[]) {
  let area;
  for (const label of labels) {
    if (PRACTICE_AREAS.includes(label.toLowerCase())) {
      area = label;
    }
  }
  return area;
}

function extract(first: string, last:string, body:string) {
  const [_, _name] = body.split(first);
  const [name] = _name.split(last);
  const target = name.replace(/[\n\r]/g, "");
  return target;
}

function getTeamNameAndProductName(body: string) {
  const teamName = extract(
    TICKET_STRINGS.teamName,
    TICKET_STRINGS.productName,
    body
  );

  const productName = extract(
    TICKET_STRINGS.productName,
    TICKET_STRINGS.featureName,
    body
  );

  return `${teamName} - ${productName}`;
}

function updateObj(item: string) {
  if (item in OBJ) {
    OBJ[item] = OBJ[item] + 1;
  } else {
    OBJ[item] = 1;
  }
}
