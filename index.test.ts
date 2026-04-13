import error400 from './fixtures/errors/400.json' with { type: 'json' }
import error401 from './fixtures/errors/401.json' with { type: 'json' }
import error404 from './fixtures/errors/404.json' with { type: 'json' }
import error409 from './fixtures/errors/409.json' with { type: 'json' }
import error412 from './fixtures/errors/412.json' with { type: 'json' }
import error429 from './fixtures/errors/429.json' with { type: 'json' }
import error500 from './fixtures/errors/500.json' with { type: 'json' }
import leaseFixture from './fixtures/machines/lease.json' with { type: 'json' }
import machineFixture from './fixtures/machines/machine.json' with { type: 'json' }
import machineEventsFixture from './fixtures/machines/machineEvents.json' with { type: 'json' }
import machineListFixture from './fixtures/machines/machineList.json' with { type: 'json' }
import machineSummaryFixture from './fixtures/machines/machineSummary.json' with { type: 'json' }
import memoryFixture from './fixtures/machines/memory.json' with { type: 'json' }
import processFixture from './fixtures/machines/process.json' with { type: 'json' }
import { Machine } from './index.ts'

const machineId = '86de8f0e6e0890'

describe('Machine', () => {
  let machine: Machine
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    machine = new Machine('my-app', 'test-token')
    mockFetch = vi.fn<typeof fetch>()
    globalThis.fetch = mockFetch as typeof fetch
  })

  const mockSuccessResponse = (data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  }

  const mockErrorResponse = (status: number, data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(data),
    } as Response)
  }

  describe('list()', () => {
    it('returns list of machines', async () => {
      mockSuccessResponse(machineListFixture)

      const result = await machine.list()

      expect(result).toEqual(machineListFixture)
      expect(mockFetch).toHaveBeenCalledOnce()
    })

    it('returns summary list when summary=true', async () => {
      mockSuccessResponse([machineSummaryFixture])

      const result = await machine.list({ summary: true })

      expect(result).toEqual([machineSummaryFixture])
    })

    it('includes query params for include_deleted', async () => {
      mockSuccessResponse([])

      await machine.list({ include_deleted: true })

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      const url = new URL(calledWith.url)
      expect(url.searchParams.get('include_deleted')).toBe('true')
    })
  })

  describe('get()', () => {
    it('returns machine by id', async () => {
      mockSuccessResponse(machineFixture)

      const result = await machine.get({ machineId })

      expect(result).toEqual(machineFixture)
    })
  })

  describe('create()', () => {
    it('creates a machine with config', async () => {
      mockSuccessResponse(machineFixture)

      const result = await machine.create({
        config: { image: 'registry.fly.io/app-name:latest' },
      })

      expect(result).toEqual(machineFixture)
    })
  })

  describe('waitFor()', () => {
    it('waits for machine state', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.waitFor({
        machineId,
        instance_id: 'ins_abc123',
        state: 'started',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('update()', () => {
    it('updates machine config', async () => {
      mockSuccessResponse(machineFixture)

      const result = await machine.update({
        machineId,
        config: { image: 'registry.fly.io/app-name:v2' },
      })

      expect(result).toEqual(machineFixture)
    })
  })

  describe('suspend()', () => {
    it('suspends a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.suspend({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('stop()', () => {
    it('stops a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.stop({ machineId })

      expect(result).toEqual({ ok: true })
    })

    it('stops machine with signal', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.stop({
        machineId,
        signal: 'SIGTERM',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('signal()', () => {
    it('sends signal to machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.signal({
        machineId,
        signal: 'SIGINT',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('start()', () => {
    it('starts a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.start({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('restart()', () => {
    it('restarts a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.restart({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('delete()', () => {
    it('deletes a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.delete({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('createLease()', () => {
    it('creates a lease', async () => {
      mockSuccessResponse(leaseFixture)

      const result = await machine.createLease({ machineId, ttl: 3600 })

      expect(result).toEqual(leaseFixture)
    })
  })

  describe('getLease()', () => {
    it('gets a lease', async () => {
      mockSuccessResponse(leaseFixture)

      const result = await machine.getLease({ machineId })

      expect(result).toEqual(leaseFixture)
    })
  })

  describe('releaseLease()', () => {
    it('releases a lease', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.releaseLease({
        machineId,
        nonce: 'nonce_abc123',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('cordon()', () => {
    it('cordons a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.cordon({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('uncordon()', () => {
    it('uncordons a machine', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.uncordon({ machineId })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('getMetadata()', () => {
    it('gets machine metadata', async () => {
      mockSuccessResponse({ app: 'my-app' })

      const result = await machine.getMetadata({ machineId })

      expect(result).toEqual({ app: 'my-app' })
    })
  })

  describe('setMetadata()', () => {
    it('sets machine metadata', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.setMetadata({
        machineId,
        key: 'env',
        value: { env: 'prod' },
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('updateMetadata()', () => {
    it('updates machine metadata', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.updateMetadata({
        machineId,
        metadata: { env: 'prod' },
        updated_at: '2024-01-15T12:00:00.000Z',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('upsertMetadata()', () => {
    it('upserts machine metadata', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.upsertMetadata({
        machineId,
        key: 'env',
        value: 'prod',
        updated_at: '2024-01-15T12:00:00.000Z',
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('deleteMetadata()', () => {
    it('deletes machine metadata', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.deleteMetadata({
        machineId,
        key: 'env',
        value: { env: 'prod' },
      })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('listProcesses()', () => {
    it('lists machine processes', async () => {
      mockSuccessResponse(processFixture)

      const result = await machine.listProcesses({ machineId })

      expect(result).toEqual(processFixture)
    })
  })

  describe('listEvents()', () => {
    it('lists machine events', async () => {
      mockSuccessResponse(machineEventsFixture)

      const result = await machine.listEvents({ machineId })

      expect(result).toEqual(machineEventsFixture)
    })
  })

  describe('getMemory()', () => {
    it('gets machine memory info', async () => {
      mockSuccessResponse(memoryFixture)

      const result = await machine.getMemory({ machineId })

      expect(result).toEqual(memoryFixture)
    })
  })

  describe('setMemory()', () => {
    it('sets machine memory', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.setMemory({ machineId, limit_mb: 512 })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('reclaimMemory()', () => {
    it('reclaims machine memory', async () => {
      mockSuccessResponse({ ok: true })

      const result = await machine.reclaimMemory({ machineId, amount_mb: 128 })

      expect(result).toEqual({ ok: true })
    })
  })

  describe('exec()', () => {
    it('executes command in machine', async () => {
      mockSuccessResponse({ exit_code: 0 })

      const result = await machine.exec({
        machineId,
        cmd: '/bin/sh -c "echo hello"',
      })

      expect(result).toEqual({ exit_code: 0 })
    })
  })

  describe('listVersions()', () => {
    it('lists machine versions', async () => {
      mockSuccessResponse([{ version: 1 }])

      const result = await machine.listVersions({ machineId })

      expect(result).toEqual([{ version: 1 }])
    })
  })

  describe('errors', () => {
    it('throws FlyApiError on 400', async () => {
      mockErrorResponse(400, error400)

      await expect(machine.list()).rejects.toThrow('Fly API error: 400')
    })

    it('throws FlyApiError on 401', async () => {
      mockErrorResponse(401, error401)

      await expect(machine.list()).rejects.toThrow('Fly API error: 401')
    })

    it('throws FlyApiError on 404', async () => {
      mockErrorResponse(404, error404)

      await expect(machine.list()).rejects.toThrow('Fly API error: 404')
    })

    it('throws FlyApiError on 409', async () => {
      mockErrorResponse(409, error409)

      await expect(machine.list()).rejects.toThrow('Fly API error: 409')
    })

    it('throws FlyApiError on 412', async () => {
      mockErrorResponse(412, error412)

      await expect(machine.list()).rejects.toThrow('Fly API error: 412')
    })

    it('throws FlyApiError on 429', async () => {
      mockErrorResponse(429, error429)

      await expect(machine.list()).rejects.toThrow('Fly API error: 429')
    })

    it('throws FlyApiError on 500', async () => {
      mockErrorResponse(500, error500)

      await expect(machine.list()).rejects.toThrow('Fly API error: 500')
    })

    it('throws FLY_FETCH_ERROR on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'))

      await expect(machine.list()).rejects.toThrow('FLY_FETCH_ERROR')
    })
  })

  describe('URL construction', () => {
    it('uses default origin in non-production', async () => {
      mockSuccessResponse(machineFixture)

      await machine.list()

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      expect(calledWith.url).toContain('https://api.machines.dev')
    })

    it('uses custom origin when provided', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const machineWithOrigin = new Machine(
        'my-app',
        'token',
        'https://custom.api'
      )
      mockSuccessResponse(machineFixture)

      await machineWithOrigin.list()

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      expect(calledWith.url).toContain('https://custom.api')
    })

    it('uses internal API URL in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const productionMachine = new Machine('my-app', 'token')
      mockSuccessResponse(machineFixture)

      await productionMachine.list()

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      expect(calledWith.url).toContain('http://_api.internal:4280')
    })
  })

  describe('headers', () => {
    it('sets Authorization header', async () => {
      mockSuccessResponse(machineFixture)

      await machine.list()

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      expect(calledWith.headers.get('Authorization')).toBe('Bearer test-token')
    })

    it('sets Content-Type header', async () => {
      mockSuccessResponse(machineFixture)

      await machine.list()

      const calledWith = mockFetch.mock.calls[0]?.[0] as Request
      expect(calledWith.headers.get('Content-Type')).toBe('application/json')
    })
  })
})
