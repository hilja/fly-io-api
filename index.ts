import type {
  CordonMachineReq,
  CreateLeaseReq,
  CreateMachineReq,
  DeleteLeaseReq,
  DeleteMachineMetadataReq,
  DeleteMachineReq,
  Endpoints,
  ExecMachineReq,
  ExecMachineRes,
  GetLeaseReq,
  GetMachineReq,
  GetMemoryReq,
  GetMetadataMachineReq,
  GetMetadataRes,
  LeaseRes,
  ListEventsReq,
  ListMachineReq,
  ListMachineVersionsReq,
  ListProcessesReq,
  ListRes,
  MachineConfig,
  MachineRes,
  MachineVersionRes,
  MemoryRes,
  OkRes,
  ProcessRes,
  ReclaimMemoryReq,
  ReclaimMemoryRes,
  RestartMachineReq,
  SetMemoryReq,
  SetMetadataMachineReq,
  SignalMachineReq,
  StartMachineReq,
  StopMachineReq,
  SuspendMachineReq,
  UncordonMachineReq,
  UpdateMachineReq,
  UpdateMetadataMachineReq,
  UpsertMetadataMachineReq,
  WaitMachineReq,
} from './fly.types.machine.ts'
import type { MachineEvent } from './fly.types.ts'

export type PostBody =
  | MachineConfig
  | Omit<UpdateMachineReq, 'config' | 'machineId'>
  | Omit<CreateLeaseReq, 'machineId'>
  | Omit<StopMachineReq, 'machineId'>
  | Omit<ExecMachineReq, 'machineId'>
  | Omit<UpdateMetadataMachineReq, 'machineId'>
  | Omit<UpsertMetadataMachineReq, 'machineId' | 'key'>
  | Omit<SetMemoryReq, 'machineId'>
  | Omit<ReclaimMemoryReq, 'machineId'>

export class Machine {
  token: string
  app: string
  origin?: string
  constructor(app: string, token: string, origin?: string) {
    this.token = token
    this.app = app
    this.origin = origin
  }

  /**
   * List all Machines associated with a specific app, with optional filters for
   * including deleted Machines and filtering by region.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#list-machines}
   * @see {@link https://fly.io/docs/flyctl/machine-list/ | Fly CLI docs}
   */
  list<TSummary extends boolean = false>(
    args?: ListMachineReq<TSummary>
  ): Promise<ListRes<TSummary>[]> {
    const params = new URLSearchParams()

    if (typeof args !== 'undefined') {
      for (const [key, val] of Object.entries(args)) {
        params.append(key, this.#getVal(val))
      }
    }

    return this.#fetch(this.#get({ params }))
  }

  /**
   * Given the name of a Fly App and a Fly Machine ID, retrieve the details of
   * that Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-list/ | Fly CLI docs}
   */
  get({ machineId }: GetMachineReq): Promise<MachineRes> {
    return this.#fetch(this.#get({ machineId }))
  }

  /**
   * Given the name of a Fly App, create a Fly Machine, given the URI of a
   * container image, in some region (or, by default, the region closest to you)
   * on Fly.io’s platform. If successful, that Machine will boot up by default.
   * Create a Machine without booting it by setting `skip_launch`.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine-with-services | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-create/ | Fly CLI docs}
   */
  create({ config }: CreateMachineReq): Promise<MachineRes> {
    return this.#fetch(this.#post({ body: config }))
  }

  /**
   * Wait for a Machine to reach a specified state.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#wait-for-a-machine-to-reach-a-specified-state | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-wait/ | Fly CLI docs}
   */
  waitFor({ machineId, ...args }: WaitMachineReq): Promise<OkRes> {
    const params = new URLSearchParams()
    for (const [key, val] of Object.entries(args)) {
      params.append(key, this.#getVal(val))
    }

    return this.#fetch(this.#get({ machineId, params, endpoint: 'wait' }))
  }

  /**
   * Given the name of a Fly App and a Fly Machine ID, update the configuration
   * of the Machine. If the Machine is running and the request is successful, it
   * will reboot; if the Machine isn’t running, and you don’t want it to start
   * up, set `skip_launch`.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#update-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-update/ | Fly CLI docs}
   */
  update({ machineId, ...body }: UpdateMachineReq): Promise<MachineRes> {
    return this.#fetch(this.#post({ machineId, body }))
  }

  /**
   * Suspending a Machine pauses the Machine and takes a snapshot of its state,
   * including its memory. The next start operation will attempt (but is not
   * guaranteed) to resume the Machine from the snapshot, rather than performing
   * a cold boot.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#suspend-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-suspend/ | Fly CLI docs}
   */
  suspend({ machineId }: SuspendMachineReq): Promise<OkRes> {
    const req = this.#post({ machineId, endpoint: 'suspend' })
    return this.#fetch(req)
  }

  /**
   * Stopping a started Machine will shut down the Machine, but not destroy it.
   * The Machine can be started again with `Machine.start()`.
   *
   * Stopping a suspended Machine will invalidate its snapshot, forcing it to
   * perform a cold boot the next time it is started.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#stop-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-stop/ | Fly CLI docs}
   */
  stop({ machineId, signal, timeout }: StopMachineReq): Promise<OkRes> {
    const req = this.#post({
      body: {
        ...(signal && { signal }),
        ...(timeout && { timeout }),
      },
      endpoint: 'stop',
      machineId,
    })
    return this.#fetch(req)
  }

  /**
   * Send a signal to a specific Machine within an app using the details
   * provided in the request body.
   *
   * @see {@link https://docs.machines.dev | Fly OpenAPI docs}
   */
  signal({ machineId, signal }: SignalMachineReq): Promise<OkRes> {
    return this.#fetch(
      this.#post({ body: { signal }, endpoint: 'signal', machineId })
    )
  }

  /**
   * Start a Machine.
   *
   * Stopped Machines that are restarted are completely reset to their original
   * state so that they start clean on the next run.
   *
   * Suspended Machines that are started attempt to resume from the snapshot
   * taken when they were suspended. If this is not possible, then they will
   * perform a cold boot, as though starting from the stopped state; however,
   * their root file systems will not be reset.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#start-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-start/ | Fly CLI docs}
   */
  start({ machineId }: StartMachineReq): Promise<OkRes> {
    return this.#fetch(this.#post({ endpoint: 'start', machineId }))
  }

  /**
   * Restart a specific Machine within an app, with an optional timeout
   * parameter.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   * @see {@link https://fly.io/docs/flyctl/machine-restart/ | Fly CLI docs}
   */
  restart({ machineId }: RestartMachineReq): Promise<OkRes> {
    return this.#fetch(this.#post({ endpoint: 'restart', machineId }))
  }

  /**
   * Delete a Machine. This action cannot be undone.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#delete-a-machine-permanently | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-delete/ | Fly CLI docs}
   */
  delete({ machineId, force }: DeleteMachineReq): Promise<OkRes> {
    const params = new URLSearchParams()
    if (force) params.append('force', this.#getVal(force))

    return this.#fetch(this.#delete({ machineId, params }))
  }

  /**
   * Create a lease for a specific Machine within an app using the details
   * provided in the request body. Machine leases can be used to obtain an
   * exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  createLease({
    machineId,
    ttl,
    description,
  }: CreateLeaseReq): Promise<LeaseRes> {
    return this.#fetch(
      this.#post({ body: { ttl, description }, endpoint: 'lease', machineId })
    )
  }

  /**
   * Retrieve the current lease of a specific Machine within an app. Machine
   * leases can be used to obtain an exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  getLease({ machineId }: GetLeaseReq): Promise<LeaseRes> {
    return this.#fetch(this.#get({ endpoint: 'lease', machineId }))
  }

  /**
   * Release the lease of a specific Machine within an app. Machine leases can
   * be used to obtain an exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#release-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  releaseLease({ machineId, nonce }: DeleteLeaseReq): Promise<LeaseRes> {
    const headers = new Headers({ nonce })
    return this.#fetch(this.#delete({ endpoint: 'lease', headers, machineId }))
  }

  /**
   * “Cordoning” a Machine refers to disabling its services, so the Fly Proxy
   * won’t route requests to it. In flyctl this is used by blue/green
   * deployments; one set of Machines is started up with services disabled, and
   * when they are all healthy, the services are enabled on the new Machines and
   * disabled on the old ones.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#route-requests-away-from-or-back-to-a-machine | Fly API docs}
   */
  cordon({ machineId }: CordonMachineReq): Promise<OkRes> {
    return this.#fetch(this.#post({ endpoint: 'cordon', machineId }))
  }

  /**
   * “Cordoning” a Machine refers to disabling its services, so the Fly Proxy
   * won’t route requests to it. In flyctl this is used by blue/green •
   * deployments; one set of Machines is started up with services disabled, and
   * when they are all healthy, the services are enabled on the new Machines and
   * disabled on the old ones.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#route-requests-away-from-or-back-to-a-machine | Fly API docs}
   */
  uncordon({ machineId }: UncordonMachineReq): Promise<OkRes> {
    return this.#fetch(this.#post({ endpoint: 'uncordon', machineId }))
  }

  /**
   * Get the metadata defined in a specific Machine’s config.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machines-metadata | Fly API docs}
   */
  getMetadata({ machineId }: GetMetadataMachineReq): Promise<GetMetadataRes> {
    return this.#fetch(this.#get({ endpoint: 'metadata', machineId }))
  }

  /**
   * Add or update a metadata key-value pair on a specific Machine’s config.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#add-or-update-machine-metadata | Fly API docs}
   */
  setMetadata({
    machineId,
    key,
    value,
  }: SetMetadataMachineReq): Promise<unknown> {
    return this.#fetch(
      this.#post({ body: value, endpoint: 'metadata', key, machineId })
    )
  }

  /**
   * Update multiple metadata keys at once. Null values and empty strings remove
   * keys.
   *
   * If machine_version is provided and no longer matches the current machine
   * version, returns 412 Precondition Failed.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  updateMetadata({
    machineId,
    machine_version,
    metadata,
    updated_at,
  }: UpdateMetadataMachineReq): Promise<unknown> {
    return this.#fetch(
      this.#post({
        body: { machine_version, metadata, updated_at },
        endpoint: 'metadata',
        machineId,
      })
    )
  }

  /**
   * Update multiple metadata keys at once. Null values and empty strings remove
   * keys.
   *
   * If machine_version is provided and no longer matches the current machine
   * version, returns 412 Precondition Failed.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  upsertMetadata({
    machineId,
    key,
    updated_at,
    value,
  }: UpsertMetadataMachineReq): Promise<unknown> {
    return this.#fetch(
      this.#post({
        machineId,
        endpoint: 'metadata',
        body: { updated_at, value },
        key,
      })
    )
  }

  /**
   * Delete metadata for a specific Machine within an app by providing a
   * metadata key.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  deleteMetadata({ machineId, key }: DeleteMachineMetadataReq): Promise<OkRes> {
    return this.#fetch(this.#delete({ endpoint: 'metadata', key, machineId }))
  }

  /**
   * List all processes running on a specific Machine within an app, with
   * optional sorting parameters.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  listProcesses({
    machineId,
    sortBy,
    order,
  }: ListProcessesReq): Promise<ProcessRes> {
    const params = new URLSearchParams()
    if (sortBy) params.append('sort_by', sortBy)
    if (order) params.append('order', order)

    return this.#fetch(this.#get({ endpoint: 'ps', machineId, params }))
  }

  /**
   * List all processes running on a specific Machine within an app, with
   * optional sorting parameters.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  listEvents({ machineId }: ListEventsReq): Promise<MachineEvent> {
    return this.#fetch(this.#get({ endpoint: 'events', machineId }))
  }

  /**
   * Get current memory limit and available capacity for a machine
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  getMemory({ machineId }: GetMemoryReq): Promise<MemoryRes> {
    return this.#fetch(this.#get({ endpoint: 'memory', machineId }))
  }

  /**
   * Set the memory limit for a machine using the balloon device
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  setMemory({ machineId, limit_mb }: SetMemoryReq): Promise<MemoryRes> {
    return this.#fetch(
      this.#post({
        body: { limit_mb },
        endpoint: 'memory',
        machineId,
        method: 'put',
      })
    )
  }

  /**
   * Trigger the balloon device to reclaim memory from a machine
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  reclaimMemory({
    machineId,
    amount_mb,
  }: ReclaimMemoryReq): Promise<ReclaimMemoryRes> {
    return this.#fetch(
      this.#post({ body: { amount_mb }, endpoint: 'reclaim', machineId })
    )
  }

  /**
   * Execute a command on a specific Machine and return the raw command output
   * bytes.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  exec({
    // oxlint-disable-next-line typescript/no-deprecated
    cmd,
    command,
    container,
    machineId,
    stdin,
    timeout,
  }: ExecMachineReq): Promise<ExecMachineRes> {
    return this.#fetch(
      this.#post({
        machineId,
        endpoint: 'exec',
        body: { cmd, command, container, stdin, timeout },
      })
    )
  }

  /**
   * List all versions of the configuration for a specific Machine within an
   * app.
   *
   * @see {@link https://docs.machines.dev | Fly OpenAPI docs}
   */
  listVersions({
    machineId,
  }: ListMachineVersionsReq): Promise<MachineVersionRes> {
    return this.#fetch(this.#get({ endpoint: 'versions', machineId }))
  }

  // Utility methods:

  async #fetch(request: Request) {
    try {
      const res = await fetch(request)

      if (!res.ok) throw new Error('FLY_FETCH_NETWORK_ERROR', { cause: res })

      return await res.json()
    } catch (err) {
      throw new Error('FLY_FETCH_ERROR', { cause: err })
    }
  }

  #getVal(val: string | boolean) {
    return typeof val === 'boolean' ? (val === true ? 'true' : 'false') : val
  }

  #getUrl({
    machineId,
    endpoint,
    key,
    params,
  }: {
    machineId?: string
    endpoint?: Endpoints
    key?: string
    params?: URLSearchParams
  }) {
    const origin =
      this.origin || process.env['NODE_ENV'] === 'production'
        ? 'http://_api.internal:4280'
        : 'https://api.machines.dev'
    const path = ['/v1/apps', this.app, 'machines', machineId, endpoint, key]
      .filter(Boolean)
      .join('/')
    let url: URL
    try {
      url = new URL(path, origin)
    } catch (err) {
      throw new Error('FLY_GET_URL_ERROR', { cause: err })
    }

    // Add search params if we have any
    if (params) {
      params.forEach((val, key) => {
        url.searchParams.set(key, val)
      })
      url.searchParams.sort()
    }

    return url
  }

  #get({
    endpoint,
    key,
    machineId,
    params,
  }: {
    endpoint?: Endpoints
    key?: string
    machineId?: string
    params?: URLSearchParams
  }) {
    const url = this.#getUrl({ machineId, endpoint, key, params })

    return new Request(url, { headers: this.#headers(), method: 'get' })
  }

  #delete({
    endpoint,
    headers,
    key,
    machineId,
    params,
  }: {
    endpoint?: Endpoints
    headers?: Headers
    key?: string
    machineId?: string
    params?: URLSearchParams
  }) {
    const url = this.#getUrl({ machineId, endpoint, key, params })

    return new Request(url, {
      headers: this.#headers(headers),
      method: 'delete',
    })
  }

  #post({
    body,
    endpoint,
    key,
    machineId,
    method = 'post',
  }: {
    body?: PostBody
    endpoint?: Endpoints
    key?: string
    machineId?: string
    method?: 'post' | 'put'
  }) {
    const url = this.#getUrl({ machineId, endpoint, key })

    return new Request(url, {
      ...(body && { body: JSON.stringify(body) }),
      headers: this.#headers(),
      method,
    })
  }

  #headers(extraHeaders?: Headers) {
    const headers = new Headers()
    headers.set('Authorization', `Bearer ${this.token}`)
    headers.set('Content-Type', 'application/json')

    // Merge headers if needed
    if (extraHeaders) {
      extraHeaders.forEach((val, key) => {
        headers.append(key, val)
      })
    }

    return headers
  }
}
