# Contributing to Vibewright

Thanks for wanting to help! Bug reports, ideas, translations and pull requests are all welcome – in **English or German**.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Report a bug or suggest an idea

- Search the [issues](https://github.com/neodk2004/vibewright/issues) first – maybe it is already known.
- Use the **Bug report** or **Feature request** template. For bugs, the version, your operating system and a screenshot help most.
- **Security problems** never go into a public issue – see [SECURITY.md](SECURITY.md).

## Set up the code

You need [Node.js](https://nodejs.org) 22 and [Claude Code](https://docs.claude.com/en/docs/claude-code/setup) (signed in).

```bash
git clone https://github.com/neodk2004/vibewright.git
cd vibewright/app
npm install
npm start
```

The [developer guide](docs/developer-guide.md) explains the architecture, the Claude calls, the test mode and how to build installers.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep the change focused – one topic per pull request.
3. Run `npm test` in `app/` (real Claude calls, about a minute, uses a little of your limit).
4. Visible UI change? Add a screenshot (light and dark mode if colors changed).
5. New or updated dependency? Run `npm run notices` and commit the regenerated `THIRD_PARTY_NOTICES.md`.

## Ground rules for code

- **Vanilla JavaScript**, no framework and as few dependencies as possible – check whether Electron, Node or a few lines already do the job.
- Match the surrounding code: German identifiers and comments are fine (the code base uses them), keep the comment density similar.
- **No page scrolling** – every view must fit the window (compact mode below 720 px height).
- **Plain language for users**: no commands to type, official download links only, nothing gets installed without the user's OK.
- New UI text needs an English translation in `app/i18n.js`; text in generated files goes into the `EN` table in `app/core.js`.
- Animations must respect `prefers-reduced-motion`.
- Must work for **every user** on Windows and macOS – no hard-coded paths, accounts or local setups.

## Licensing

Vibewright is [MIT-licensed](LICENSE). By submitting a contribution you agree that it is published under the same license.

AI-assisted contributions are welcome – please mention it in the pull request, as this project does too.
