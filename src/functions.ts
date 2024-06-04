export function showContainer(id: string): void {
  const tokenContainer = document.getElementById(id);
  tokenContainer.classList.remove('hide-container');
}

export function hideContainer(id: string): void {
  const tokenContainer = document.getElementById(id);
  tokenContainer.classList.add('hide-container');
}

// should we show the token input or the update token button
export function tokenUIResponse(isToken: boolean): void {
  if (isToken) {
    updateButtonText('transmit-button', 'update token');
  } else {
    updateButtonText('transmit-button', 'add token');
    showContainer('no-token')
  }
}

function updateButtonText(buttonId: string, text: string) {
  const vaButton = document.getElementById(buttonId)
  vaButton.setAttribute('text', text);
}

export function uploadUIResponse(uploadResult: any): void {
  // parse error
  if (uploadResult.parseOk) {
    hideContainer('parse-error');
  } else {
    showContainer('parse-error');
    addAlert('error', `File could not be parsed. ${uploadResult.error}`, 'parse-error')
  }

  // bad creds
  if (uploadResult.badcreds) {
    showContainer('bad-creds');
    addAlert('error', 'Bad Github Credentials - your token may be expired.', 'bad-creds');
  } else {
    hideContainer('bad-creds');
  }
  
  // ok
  if (uploadResult.createIssuesOk) {
    showContainer('upload-ok');
    addAlert('success', `Created ${uploadResult.totalCreated} ${isPlural(uploadResult.totalCreated)}.`, 'upload-ok');
    failedFileList(uploadResult.failedIssues);
    addMilestone(uploadResult.milestone);
  } else {
    hideContainer('upload-ok');
  }

  // failed issues
  if (uploadResult.failedIssues && uploadResult.failedIssues.length > 0) {
    showContainer('failed-issues');
    addAlert('error', getFailedMessage(uploadResult.failedIssues), 'failed-issues')
  } else {
    hideContainer('failed-issues')
  }

  // no token
  if (uploadResult.noToken) {
    showContainer('no-token');
    addAlert('error', 'No token stored. Please add.', 'no-token');
  }

  showContainer('upload-results-container');
}

function addAlert(status: string, message: string, id: string) {
  const alert = document.createElement('va-alert');
  alert.setAttribute('status', status);
  alert.setAttribute('visible', 'true');
  alert.innerHTML = message
  document.getElementById(id).appendChild(alert);
}

function addMilestone(milestone: string) {
  const code = document.getElementById('milestone').querySelector('code');
  code.innerHTML = `https://github.com/department-of-veterans-affairs/va.gov-team/milestone/${milestone}`;
  showContainer('milestone');
}

function getFailedMessage(list: string[]): string {
  let message = `<div>Could not create ${list.length} ${isPlural(list.length)}:</div>`;
  message += failedFileList(list);
  return message;
}

function failedFileList(list: string[]): string {
  let html = '<ul>';
  for (const file of list) {
    html += `<li>${file}</li>`;
  }
  html += '</ul>';
  return html;
}

export function clearPreviousResults() {
  hideContainer('upload-results-container');
  const container = document.getElementById('upload-results-container');
  const alerts = container.querySelectorAll('va-alert');
  for (const alert of alerts) {
    alert.remove();
  }
  hideContainer('milestone');
}

export function tokenUpdateResponse({tokenSaveOk}: { tokenSaveOk: boolean}) {
  showContainer('token-update');
  if (tokenSaveOk)
    addAlert('success', 'Token updated.', 'token-update');
  else {
    addAlert('error', 'Token failed to update.', 'token-update');
  }
  showContainer('upload-results-container');
}

function isPlural(leng: number): string {
  return leng > 1 ? 'tickets' : 'ticket'
}