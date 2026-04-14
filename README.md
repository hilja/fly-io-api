# fly-io-api

TypeScript conduit to Fly.io machines API.

## Install

```sh
pnpm add fly-io-api
```

## Usage

```ts
import { Machine } from './index.ts'

const myApp = new Machine(process.env['FLY_API_TOKEN']!, 'my_app')

const stopped: string[] = []
for (const machine of await myApp.list()) {
  if (machine.state === 'stopped') stopped.push(machine.id)
}

// Start the machines for example
await Promise.all(stopped.map(machineId => myApp.start({ machineId })))
```

The origin is set from `process.env.NODE_ENV`, but you can have your own:

```ts
const origin =
  process.env['MY_ENV'] === 'live'
    ? 'http://_api.internal:4280'
    : 'https://api.machines.dev'

new Machine(process.env['FLY_API_TOKEN']!, 'foo', origin)
```

Sorry no real docs yet, check `index.ts`, `index.test.ts` or see:

- Fly OpenAPI Scalar docs: [https://docs.machines.dev/](docs.machines.dev)
- Or the:
  [main docs site](https://fly.io/docs/machines/api/machines-resource/#add-or-update-machine-metadata)

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
