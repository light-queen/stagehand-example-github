# 🤘 Welcome to Stagehand!

Hey! This is a project built with [Stagehand](https://github.com/browserbase/stagehand).

It's a simple example of a web agent that can be used to automate a browser, and in this example, we're using it to create a fun issue on GitHub.

1. Create a new context on Browserbase
1. Login to GitHub using this context
1. Create a new Browserbase session with the persisted context so you can pre-login to GitHub
1. Use the `observe` action to fill in the form
1. Create the issue by passing the results from `observe` to the `act` function!

You can build your own web agent using: `npx create-browser-app`! This builds off our context persistence feature, which allows you to persist a browser session across multiple browser sessions. You can check out this feature with:

```bash
npx create-browser-app --example persist-context
```

## Setting the Stage

Stagehand is an SDK for automating browsers. It's built on top of [Playwright](https://playwright.dev/) and provides a higher-level API for better debugging and AI fail-safes.

## Curtain Call

### Add your API keys

Required API keys/environment variables are in the `.env.example` file. Copy it to `.env` and add your API keys.

```bash
cp .env.example .env && nano .env # Add your API keys to .env
```

### Run the project

Get ready for a show-stopping development experience. Just run:

```bash
npm install && npm start
```

## What's Next?

### Custom .cursorrules

We have custom .cursorrules for this project. It'll help quite a bit with writing Stagehand easily.

### Run on Browserbase

To run on Browserbase, add your API keys to .env and change `env: "LOCAL"` to `env: "BROWSERBASE"` in [stagehand.config.ts](stagehand.config.ts).

### Use Anthropic Claude 3.5 Sonnet

1. Add your API key to .env
2. Change `modelName: "gpt-4o"` to `modelName: "claude-3-5-sonnet-latest"` in [stagehand.config.ts](stagehand.config.ts)
3. Change `modelClientOptions: { apiKey: process.env.OPENAI_API_KEY }` to `modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY }` in [stagehand.config.ts](stagehand.config.ts)
