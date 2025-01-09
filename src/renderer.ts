/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import './index.css';

import '@department-of-veterans-affairs/component-library/dist/main.css';
import {
  defineCustomElements,
} from "@department-of-veterans-affairs/web-components/loader";

defineCustomElements();

import { tokenUIResponse, clearPreviousResults, showContainer, hideContainer } from "./functions";

document.getElementById('choose-file-button').addEventListener('click', () => {
  clearPreviousResults();
  // show loading indicator
  showContainer('loading-container');
  const dst = document.getElementById('dst') as HTMLInputElement;
  window.api.showOpenDialog(dst.checked);
});

// when user clicks the button the token is sent to backend if it is not empty string
const transmitButton = document.getElementById('transmit-button');
transmitButton.addEventListener('click', () => {
  clearPreviousResults();
  showContainer('loading-container');

  const inputEl = document.getElementById('gh-token-input') as HTMLInputElement;

  const { value: token } = inputEl;
  // hide the token input and transmit to backend if not empty string
  if (token) {
    inputEl.value = '';
    tokenUIResponse(!!token);
    window.api.transmitToken(token);
  } else {
    hideContainer('loading-container');
  }
});

const copySlackButton = document.querySelector('div.copy-slack-container va-button');
copySlackButton.addEventListener('click', handleCopy);
async function handleCopy() {
  const container = document.getElementById("slack-text");
  let dialog: HTMLDialogElement;
  try {
    await navigator.clipboard.writeText(container.innerHTML);
    dialog = document.getElementById('success-dialog')as HTMLDialogElement;
  } catch (err) {
    dialog = document.getElementById('fail-dialog') as HTMLDialogElement;
  }
  if (dialog && 'showModal' in dialog) {
    (dialog as any).showModal();
  }
}

const dialogs = document.querySelectorAll('dialog va-button');
Array.from(dialogs).forEach(dialog => {
  dialog.addEventListener('click', (event) => {
    const { target } = event;
    const dialog = (target as HTMLElement).parentElement.parentElement as HTMLDialogElement;
    if (dialog && 'close' in dialog) {
      (dialog as any).close();
    }
  });
});