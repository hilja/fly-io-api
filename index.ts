import type * as T from './types.ts'
import { FlyApiError } from './types.ts'

export type PostBody =
  | T.MachineConfig
  | Omit<T.UpdateMachineReq, 'config' | 'machineId'>
  | Omit<T.CreateLeaseReq, 'machineId'>
  | Omit<T.StopMachineReq, 'machineId'>
  | Omit<T.ExecMachineReq, 'machineId'>
  | Omit<T.UpdateMetadataMachineReq, 'machineId'>
  | Omit<T.UpsertMetadataMachineReq, 'machineId' | 'key'>
  | Omit<T.SetMemoryReq, 'machineId'>
  | Omit<T.ReclaimMemoryReq, 'machineId'>

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
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#list-machines | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-list/ | Fly CLI docs}
   */
  async list<TSummary extends boolean = false>(
    args?: T.ListMachineReq<TSummary>
  ): Promise<T.ListRes<TSummary>[]> {
    const params = new URLSearchParams()

    if (typeof args !== 'undefined') {
      for (const [key, val] of Object.entries(args)) {
        params.append(key, this.#getVal(val))
      }
    }

    return this.#handleRes(await this.#fetch(this.#get({ params })))
  }

  /**
   * Given the name of a Fly App and a Fly Machine ID, retrieve the details of
   * that Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-list/ | Fly CLI docs}
   */
  async get({ machineId }: T.GetMachineReq): Promise<T.MachineRes> {
    return this.#handleRes(await this.#fetch(this.#get({ machineId })))
  }

  /**
   * Given the name of a Fly App, create a Fly Machine, given the URI of a
   * container image, in some region (or, by default, the region closest to you)
   * on Fly.io’s platform. If successful, that Machine will boot up by default.
   * Create a Machine without booting it by setting `skip_launch`.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine | Fly API docs}
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine-with-services | Fly API docs 2}
   * @see {@link https://fly.io/docs/flyctl/machine-create/ | Fly CLI docs}
   */
  async create({ config }: T.CreateMachineReq): Promise<T.MachineRes> {
    return this.#handleRes(await this.#fetch(this.#post({ body: config })))
  }

  /**
   * Wait for a Machine to reach a specified state.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#wait-for-a-machine-to-reach-a-specified-state | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-wait/ | Fly CLI docs}
   */
  async waitFor({ machineId, ...args }: T.WaitMachineReq): Promise<T.OkRes> {
    const params = new URLSearchParams()
    for (const [key, val] of Object.entries(args)) {
      params.append(key, this.#getVal(val))
    }

    return this.#handleRes(
      await this.#fetch(this.#get({ machineId, params, endpoint: 'wait' }))
    )
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
  async update({
    machineId,
    ...body
  }: T.UpdateMachineReq): Promise<T.MachineRes> {
    return this.#handleRes(await this.#fetch(this.#post({ machineId, body })))
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
  async suspend({ machineId }: T.SuspendMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#post({ machineId, endpoint: 'suspend' }))
    )
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
  async stop({
    machineId,
    signal,
    timeout,
  }: T.StopMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({ body: { signal, timeout }, endpoint: 'stop', machineId })
      )
    )
  }

  /**
   * Send a signal to a specific Machine within an app using the details
   * provided in the request body.
   *
   * @see {@link https://docs.machines.dev | Fly OpenAPI docs}
   */
  async signal({ machineId, signal }: T.SignalMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({ body: { signal }, endpoint: 'signal', machineId })
      )
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
  async start({ machineId }: T.StartMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#post({ endpoint: 'start', machineId }))
    )
  }

  /**
   * Restart a specific Machine within an app, with an optional timeout
   * parameter.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   * @see {@link https://fly.io/docs/flyctl/machine-restart/ | Fly CLI docs}
   */
  async restart({ machineId }: T.RestartMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#post({ endpoint: 'restart', machineId }))
    )
  }

  /**
   * Delete a Machine. This action cannot be undone.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#delete-a-machine-permanently | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-delete/ | Fly CLI docs}
   */
  async delete({ machineId, force }: T.DeleteMachineReq): Promise<T.OkRes> {
    const params = new URLSearchParams()
    if (force) params.append('force', this.#getVal(force))

    return this.#handleRes(
      await this.#fetch(this.#delete({ machineId, params }))
    )
  }

  /**
   * Create a lease for a specific Machine within an app using the details
   * provided in the request body. Machine leases can be used to obtain an
   * exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  async createLease({
    machineId,
    ttl,
    description,
  }: T.CreateLeaseReq): Promise<T.LeaseRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({ body: { ttl, description }, endpoint: 'lease', machineId })
      )
    )
  }

  /**
   * Retrieve the current lease of a specific Machine within an app. Machine
   * leases can be used to obtain an exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  async getLease({ machineId }: T.GetLeaseReq): Promise<T.LeaseRes> {
    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'lease', machineId }))
    )
  }

  /**
   * Release the lease of a specific Machine within an app. Machine leases can
   * be used to obtain an exclusive lock on modifying a Machine.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#release-a-machine-lease | Fly API docs}
   * @see {@link https://fly.io/docs/flyctl/machine-lease/ | Fly CLI docs}
   */
  async releaseLease({
    machineId,
    nonce,
  }: T.DeleteLeaseReq): Promise<T.LeaseRes> {
    const headers = new Headers({ nonce })
    return this.#handleRes(
      await this.#fetch(this.#delete({ endpoint: 'lease', headers, machineId }))
    )
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
  async cordon({ machineId }: T.CordonMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#post({ endpoint: 'cordon', machineId }))
    )
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
  async uncordon({ machineId }: T.UncordonMachineReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#post({ endpoint: 'uncordon', machineId }))
    )
  }

  /**
   * Get the metadata defined in a specific Machine’s config.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#get-a-machines-metadata | Fly API docs}
   */
  async getMetadata({
    machineId,
  }: T.GetMetadataMachineReq): Promise<T.GetMetadataRes> {
    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'metadata', machineId }))
    )
  }

  /**
   * Add or update a metadata key-value pair on a specific Machine’s config.
   *
   * @see {@link https://fly.io/docs/machines/api/machines-resource/#add-or-update-machine-metadata | Fly API docs}
   */
  async setMetadata({
    machineId,
    key,
    value,
  }: T.SetMetadataMachineReq): Promise<unknown> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({ body: value, endpoint: 'metadata', key, machineId })
      )
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
  async updateMetadata({
    machineId,
    machine_version,
    metadata,
    updated_at,
  }: T.UpdateMetadataMachineReq): Promise<unknown> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({
          body: { machine_version, metadata, updated_at },
          endpoint: 'metadata',
          machineId,
        })
      )
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
  async upsertMetadata({
    machineId,
    key,
    updated_at,
    value,
  }: T.UpsertMetadataMachineReq): Promise<unknown> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({
          machineId,
          endpoint: 'metadata',
          body: { updated_at, value },
          key,
        })
      )
    )
  }

  /**
   * Delete metadata for a specific Machine within an app by providing a
   * metadata key.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async deleteMetadata({
    machineId,
    key,
  }: T.DeleteMachineMetadataReq): Promise<T.OkRes> {
    return this.#handleRes(
      await this.#fetch(this.#delete({ endpoint: 'metadata', key, machineId }))
    )
  }

  /**
   * List all processes running on a specific Machine within an app, with
   * optional sorting parameters.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async listProcesses({
    machineId,
    sortBy,
    order,
  }: T.ListProcessesReq): Promise<T.ProcessRes> {
    const params = new URLSearchParams()
    if (sortBy) params.append('sort_by', sortBy)
    if (order) params.append('order', order)

    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'ps', machineId, params }))
    )
  }

  /**
   * List all processes running on a specific Machine within an app, with
   * optional sorting parameters.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async listEvents({ machineId }: T.ListEventsReq): Promise<T.MachineEvent> {
    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'events', machineId }))
    )
  }

  /**
   * Get current memory limit and available capacity for a machine
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async getMemory({ machineId }: T.GetMemoryReq): Promise<T.MemoryRes> {
    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'memory', machineId }))
    )
  }

  /**
   * Set the memory limit for a machine using the balloon device
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async setMemory({
    machineId,
    limit_mb,
  }: T.SetMemoryReq): Promise<T.MemoryRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({
          body: { limit_mb },
          endpoint: 'memory',
          machineId,
          method: 'put',
        })
      )
    )
  }

  /**
   * Trigger the balloon device to reclaim memory from a machine
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async reclaimMemory({
    machineId,
    amount_mb,
  }: T.ReclaimMemoryReq): Promise<T.ReclaimMemoryRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({ body: { amount_mb }, endpoint: 'reclaim', machineId })
      )
    )
  }

  /**
   * Execute a command on a specific Machine and return the raw command output
   * bytes.
   *
   * @see {@link https://docs.machines.dev/ | Fly OpenAPI docs}
   */
  async exec({
    command,
    container,
    machineId,
    stdin,
    timeout = 10,
  }: T.ExecMachineReq): Promise<T.ExecMachineRes> {
    return this.#handleRes(
      await this.#fetch(
        this.#post({
          machineId,
          endpoint: 'exec',
          body: { command, container, stdin, timeout },
        })
      )
    )
  }

  /**
   * List all versions of the configuration for a specific Machine within an
   * app.
   *
   * @see {@link https://docs.machines.dev | Fly OpenAPI docs}
   */
  async listVersions({
    machineId,
  }: T.ListMachineVersionsReq): Promise<T.MachineVersionRes> {
    return this.#handleRes(
      await this.#fetch(this.#get({ endpoint: 'versions', machineId }))
    )
  }

  // Utility methods:

  async #fetch(request: Request): Promise<Response> {
    try {
      return await fetch(request)
    } catch (err) {
      throw new Error('FLY_FETCH_ERROR', { cause: err })
    }
  }

  async #handleRes<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new FlyApiError(`Fly API error: ${res.status}`, res.status, body)
    }
    return res.json()
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
    endpoint?: T.Endpoints
    key?: string
    params?: URLSearchParams
  }) {
    const origin =
      this.origin ||
      (process.env['NODE_ENV'] === 'production'
        ? 'http://_api.internal:4280'
        : 'https://api.machines.dev')
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
    endpoint?: T.Endpoints
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
    endpoint?: T.Endpoints
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
    endpoint?: T.Endpoints
    key?: string
    machineId?: string
    /**
     * POST can be used as a put, since put is a derivative of post
     *
     * @default post
     */
    method?: 'post' | 'put'
  }) {
    const url = this.#getUrl({ machineId, endpoint, key })

    return new Request(url, {
      // Remove keys with undefined values
      ...(body && { body: JSON.stringify(this.#filterUndefined(body)) }),
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

  #filterUndefined<T extends Record<string, unknown>>(obj: T) {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined)
    )
  }
}
