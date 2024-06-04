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

const copyUrlButton = document.getElementById('copy-url');
copyUrlButton.addEventListener('click', async () => {
  const code = document.getElementById('milestone').querySelector('code');
  let result;
  let klass;
  try {
    await navigator.clipboard.writeText(code.innerHTML);
    result = "url copied!";
    klass = 'success';
  } catch (err) {
    klass = 'fail'
    result = "url failed to copy.";
  }
  const span = document.getElementById('copy-result');
  span.innerHTML = result;
  span.className = klass;
});