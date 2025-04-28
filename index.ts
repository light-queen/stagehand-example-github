/**
 * 🤘 Welcome to Stagehand!
 *
 * This is an example of how to use Stagehand to create a fun issue on GitHub.
 *
 * In order to do this, we make use of Browserbase's context persistence feature.
 * We also make use of the experimental `observe` action to fill in the form.
 *
 * The main() function will then create two browser sessions:
 * 		- one to login to GitHub
 * 		- one to use the cookies from the login session to create a new issue on GitHub
 *
 * TO RUN THIS PROJECT:
 * ```
 * npm install
 * npm run start
 * ```
 *
 */

import StagehandConfig from "./stagehand.config.js";
import { Stagehand } from "@browserbasehq/stagehand";
import { Browserbase } from "@browserbasehq/sdk";
import chalk from "chalk";
import dotenv from "dotenv";
import { announce } from "./utils.js";
import { promises as fs } from "fs";
import { z } from "zod";
import { Anthropic } from '@anthropic-ai/sdk';


const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

dotenv.config();

let BROWSERBASE_PROJECT_ID: string;
let BROWSERBASE_API_KEY: string;
try {
  BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID!;
  BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY!;
} catch (e) {
  throw new Error(
    "BROWSERBASE_PROJECT_ID and BROWSERBASE_API_KEY must be set in environment variables to run this example. Please check your .env file."
  );
}

const browserbase = new Browserbase({
  apiKey: BROWSERBASE_API_KEY,
});

/**
 * Creates a new session with a context ID and adds session cookies to the context
 * @param contextId - The ID of the context to persist
 */
async function persistContextSession(
  contextId: string,
  urlToLoginTo: string = "https://www.linkedin.com/"
) {
  const stagehand = new Stagehand({
    ...StagehandConfig,
    browserbaseSessionCreateParams: {
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        context: {
          id: contextId,
          persist: true,
        },
      },
    },
  });
  await stagehand.init();
  announce(
    `Session created with ID: ${stagehand.browserbaseSessionID}.\n\nSession URL: https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`
  );
  const page = stagehand.page;
  await page.goto(urlToLoginTo);

  announce(
    `Opening the debugger URL in your default browser. When you login, the following session will remember your authentication. Once you're logged in, press enter to continue...`
  );

  console.log(
    chalk.yellow("\n\nOnce you're logged in, press enter to continue...\n\n")
  );
  await openDebuggerUrl(stagehand.browserbaseSessionID!);
  await waitForEnter();
  await stagehand.close();
  console.log("Waiting 10 seconds for the context to be persisted...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log(
    chalk.green("Ready to open a new session with the persisted context!")
  );
}

/**
 * Opens a new session with a context ID and uses the cookies from the context to automatically login
 * @param contextId - The ID of the persisted context
 */
async function openPersistedContextSession(contextId: string) {
  const stagehand = new Stagehand({
    ...StagehandConfig,
    browserbaseSessionCreateParams: {
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        context: {
          id: contextId,
          persist: false, // We don't need to persist this context since we're already logged in
        },
      },
    },
  });
  await stagehand.init();
  const page = stagehand.page;
  announce(
    `Opening the debugger URL in your default browser. This session should take you to the logged in session if the context was persisted. ${chalk.red(
      "If not, try deleting context.txt and running npm run start again."
    )}`
  );
  await openDebuggerUrl(stagehand.browserbaseSessionID!);
  // This will be logged in
  
  await page.goto(`https://www.linkedin.com/posts/ericlay-virio_if-i-was-the-head-of-demand-gen-of-a-1m-activity-7315401783382589441-NwyE?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC88rZMBfZU-EPGusGweo1dOlDTeh4j97Bk`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  });

  // Wait for the page to be visibly loaded
  try {
    await page.waitForSelector('.feed-shared-update-v2, .feed-shared-actor', { 
      timeout: 30000 
    });
    console.log("LinkedIn post content loaded successfully");
  } catch (error) {
    console.log("Warning: Timed out waiting for some LinkedIn elements, continuing anyway");
  }

  await page.act({action: "click on 'most relevant' button"});
  await page.act({action: "click on 'most recent the most recent comments are first' button from dropdown"});

  const comment = await page.extract({
      instruction: "extract an unanswered comment",
      schema: z.object({
        author: z.string(),
        content: z.string(),
      }),
    });
  console.log("comment", comment);

  // Initial static comment response
  // const staticCommentResponse = "Send me a connection request so I can DM you the playbook!";

  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    
    // Dynamic comment response from Anthropic
    const dynamicCommentResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 100,
      messages: [
        { role: 'user', content: `Generate a concise response to this comment ${comment.content}.` }
      ]
    });

    console.log('Response from Claude:', dynamicCommentResponse);
    
    await page.act({
      action: `locate the comment by "${comment.author}" that says "${comment.content.substring(0, 40)}...", click its specific reply button, and wait for the reply input field to appear`
    });
    
    // Now type specifically into the reply input that just appeared
    await page.act({
      action: `type "${dynamicCommentResponse.content[0].text}" into the reply input field that just appeared for ${comment.author}'s comment`
    });
    // Use the dynamic response content
    // await page.act({action: `enter the response ${dynamicCommentResponse.content[0].text} into the comment box`});

    // wait for approval from the user
    console.log(
      chalk.yellow("\n\nIf the comment looks good, press enter to continue...\n\n")
    );
    await waitForEnter();

    // fill in the form with the values
    await page.act({action: "click on the 'reply' button to post the drafted comment"});

  } catch (error) {
    console.error('comment response failed');
    console.error(error.message || error);

  }



  // Fill in the form with the values
  // for (const candidate of commentCandidates) {
  //   console.log(candidate);
  //   await page.act(candidate);
  // }

  // Fill in the form with the values
  //  for (const candidate of formCandidates) {
  //   await page.act(candidate);
  // }

  console.log(
    chalk.green("switched to most recent comments!")
  );


  await waitForEnter();
  await stagehand.close();
}

/*
 * MAIN FUNCTION
 */
async function main() {
  if (StagehandConfig.env === "LOCAL") {
    throw new Error(
      "Your Stagehand config is set to LOCAL mode. Please set env to BROWSERBASE in stagehand.config.ts to use this feature."
    );
  }
  // Check for existing context ID
  const existingContextId = await loadContextId();

  if (existingContextId) {
    console.log("Found existing context ID:", existingContextId);
    // Open the persisted context session directly
    await openPersistedContextSession(existingContextId);
    return;
  }

  // Create a new context if none exists
  const bbContext = await browserbase.contexts.create({
    projectId: BROWSERBASE_PROJECT_ID,
  });
  console.log("Created new context:", bbContext.id);

  // Save the context ID
  await saveContextId(bbContext.id);

  // Create a new session with the context
  await persistContextSession(bbContext.id);
  announce(
    "Waiting 10 seconds before opening the persisted context session..."
  );
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Open the persisted context session
  await openPersistedContextSession(bbContext.id);
}

(async () => {
  await main();
})();

// Wait for enter key press
async function waitForEnter() {
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });
}

// Open debugger URL in default browser
async function openDebuggerUrl(sessionId: string) {
  const { debuggerFullscreenUrl } = await browserbase.sessions.debug(sessionId);
  const { exec } = await import("child_process");
  const platform = process.platform;
  const command =
    platform === "win32"
      ? "start"
      : platform === "darwin"
      ? "open"
      : "xdg-open";
  exec(`${command} ${debuggerFullscreenUrl}`);
}

async function saveContextId(contextId: string) {
  await fs.writeFile("context.txt", contextId);
}

async function loadContextId(): Promise<string | null> {
  try {
    return await fs.readFile("context.txt", "utf-8");
  } catch (error) {
    return null;
  }
}
