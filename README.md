# fly-io-api

TypeScript conduit to Fly.io machines API.

## Install

```sh
pnpm add fly-io-api
```

## Usage

Get `machinesId`s and do something with them:

```ts
import { Machine } from './index.ts'

const myApp = new Machine('my_app', process.env['FLY_API_TOKEN']!)

const stopped: string[] = []
for (const machine of await myApp.list()) {
  if (machine.state === 'stopped') stopped.push(machine.id)
}

console.log(`Starting machines: ${stopped.join(', ')}`)
await Promise.all(stopped.map(machineId => myApp.start({ machineId })))
```

The origin is set based on `process.env.NODE_ENV`, but you can have your own:

```ts
const origin =
  process.env['MY_ENV'] === 'live'
    ? 'http://_api.internal:4280'
    : 'https://api.machines.dev'

const myApp = new Machine('my_app', process.env['FLY_API_TOKEN']!, origin)
```

There's no real docs yet, but check `index.ts`, or the tests file
`index.test.ts`. Or one of these resources:

- Fly OpenAPI spec: [docs.machines.dev](https://docs.machines.dev/)
- API docs: [fly.io/docs/machines/api](https://fly.io/docs/machines/api/)
- Guide article:
  [Managing Machines with the Machines API](https://fly.io/docs/machines/guides-examples/managing-machines-with-the-api/)

## Development

```sh
pnpm i
# Hack...
pnpm format
pnpm lint
pnpm test
pnpm build
pnpm ncu # Update packages
```
