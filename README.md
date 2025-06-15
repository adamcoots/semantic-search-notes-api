# Notes API

## Description

An API to test semantic search.

## Versions

- NPM version 10.9.2
- Node version 22.14.0
- Docker version 27.5.1, build 9f9e405
- Nest CLI version 11.0.7

## Project setup

- Add `.env` file in the root directory with the following content:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notes
OPENAI_API_KEY=your_openai_api_key
```

- Replace `your_openai_api_key` with your actual OpenAI API key.

```bash
npm ci
docker compose up
npx drizzle-kit migrate
npm start api
```

## Compile and run the project

```bash
docker compose up
npm start api
```

## Helpful commands

- npm run db:studio
