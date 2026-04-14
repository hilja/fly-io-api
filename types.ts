/**
 * @file Some of the types were ripped from the `fly-admin` package, and
 *   modified heavily by me.
 * @see {@link https://github.com/supabase/fly-admin}
 */

export type WaitState = 'started' | 'stopped' | 'destroyed' | 'suspended'

export interface ApiMachineServiceConcurrency {
  hard_limit?: number
  soft_limit?: number
  type?: string
}

export interface ApiMachineService {
  autostart?: boolean
  autostop?: boolean
  checks?: ApiMachineCheck[]
  concurrency?: ApiMachineServiceConcurrency
  force_instance_description?: string
  force_instance_key?: string
  internal_port?: number
  min_machines_running?: number
  ports?: ApiMachinePort[]
  protocol?: string
}

/**
 * - `no`: Never try to restart a Machine automatically when its main process
 *   exits, whether that’s on purpose or on a crash.
 * - `always`: Always restart a Machine automatically and never let it enter a
 *   stopped state, even when the main process exits cleanly.
 * - `on-failure`: Try up to MaxRetries times to automatically restart the Machine
 *   if it exits with a non-zero exit code. Default when no explicit policy is
 *   set, and for Machines with schedules.
 */
export type ApiMachineRestartPolicyEnum = 'no' | 'always' | 'on-failure'

/**
 * The Machine restart policy defines whether and how flyd restarts a Machine
 * after its main process exits.
 *
 * @see {@link https://fly.io/docs/machines/guides-examples/machine-restart-policy/}
 */
export interface ApiMachineRestart {
  /**
   * When policy is on-failure, the maximum number of times to attempt to
   * restart the Machine before letting it stop.
   */
  max_retries?: number
  /**
   * - `no`: Never try to restart a Machine automatically when its main process
   *   exits, whether that’s on purpose or on a crash.
   * - `always`: Always restart a Machine automatically and never let it enter a
   *   stopped state, even when the main process exits cleanly.
   * - `on-failure`: Try up to MaxRetries times to automatically restart the
   *   Machine if it exits with a non-zero exit code. Default when no explicit
   *   policy is set, and for Machines with schedules.
   */
  policy?: ApiMachineRestartPolicyEnum
}

export interface ApiProxyProtoOptions {
  version?: string
}

export interface ApiHTTPOptions {
  compress?: boolean
  h2_backend?: boolean
  response?: ApiHTTPResponseOptions
}

export interface ApiHTTPResponseOptions {
  headers?: Record<string, any>
}

export interface ApiTLSOptions {
  alpn?: string[]
  default_self_signed?: boolean
  versions?: string[]
}

export interface ApiMachinePort {
  end_port?: number
  force_https?: boolean
  handlers?: string[]
  http_options?: ApiHTTPOptions
  port?: number
  proxy_proto_options?: ApiProxyProtoOptions
  start_port?: number
  tls_options?: ApiTLSOptions
}

export interface ApiMachineMount {
  add_size_gb?: number
  encrypted?: boolean
  extend_threshold_percent?: number
  name?: string
  path?: string
  size_gb?: number
  size_gb_limit?: number
  volume?: string
}

interface ApiCheckStatus {
  name?: string
  output?: string
  status?: string
  updated_at?: string
}

interface ApiImageRef {
  digest?: string
  labels?: Record<string, string>
  registry?: string
  repository?: string
  tag?: string
}

export interface ApiDNSConfig {
  skip_registration?: boolean
}

/**
 * A file that will be written to the Machine. One of RawValue or SecretName
 * must be set.
 */
export interface ApiFile {
  /**
   * GuestPath is the path on the machine where the file will be written and
   * must be an absolute path. For example: /full/path/to/file.json
   */
  guest_path?: string
  /** The base64 encoded string of the file contents. */
  raw_value?: string
  /** The name of the secret that contains the base64 encoded file contents. */
  secret_name?: string
}

export interface ApiMachineMetrics {
  path?: string
  port?: number
}

export interface ApiMachineProcess {
  cmd?: string[]
  entrypoint?: string[]
  env?: Record<string, string>
  exec?: string[]
  user?: string
}

export interface ApiStatic {
  guest_path: string
  url_prefix: string
}

export interface ApiStopConfig {
  signal?: string
  timeout?: string
}

export interface ApiMachineGuest {
  cpu_kind?: string
  cpus?: number
  gpu_kind?: string
  host_dedication_id?: string
  kernel_args?: string[]
  memory_mb?: number
}

export interface ApiMachineInit {
  cmd?: string[]
  entrypoint?: string[]
  exec?: string[]
  kernel_args?: string[]
  swap_size_mb?: number
  tty?: boolean
}

export interface ApiMachineConfig {
  /**
   * Optional boolean telling the Machine to destroy itself once it’s complete
   *
   * @default false
   */
  auto_destroy?: boolean
  checks?: Record<string, ApiMachineCheck>
  /** @deprecated: use Service.Autostart instead */
  disable_machine_autostart?: boolean
  dns?: ApiDNSConfig
  /** An object filled with key/value pairs to be set as environment variables */
  env?: Record<string, string>
  files?: ApiFile[]
  guest?: ApiMachineGuest
  /** The docker image to run */
  image?: string
  init?: ApiMachineInit
  metadata?: Record<string, string>
  metrics?: ApiMachineMetrics
  mounts?: ApiMachineMount[]
  processes?: ApiMachineProcess[]
  /**
   * The Machine restart policy defines whether and how flyd restarts a Machine
   * after its main process exits. See
   *
   * @see {@link https://fly.io/docs/machines/guides-examples/machine-restart-policy/}
   */
  restart?: ApiMachineRestart
  schedule?: string
  services?: ApiMachineService[]
  /** @deprecated use Guest instead */
  size?: string
  /**
   * Standbys enable a machine to be a standby for another. In the event of a
   * hardware failure, the standby machine will be started.
   */
  standbys?: string[]
  statics?: ApiStatic[]
  stop_config?: ApiStopConfig
}

interface ApiMachine {
  // TODO: should this be here?
  checks?: CheckStatus[]
  config?: ApiMachineConfig
  created_at?: string
  events?: MachineEvent[]
  id?: string
  image_ref?: ApiImageRef
  /** InstanceID is unique for each version of the machine */
  instance_id?: string
  name?: string
  /**
   * `nonce` is only ever returned on machine creation if a `lease_duration` was
   * provided.
   */
  nonce?: string
  /** `privateIP` is the internal 6PN address of the machine. */
  private_ip?: string
  region?: string
  state?: string
  updated_at?: string
}

/**
 * For http checks, an array of objects with string field Name and array of
 * strings field Values. The key/value pairs specify header and header values
 * that will get passed with the check call.
 */
export interface ApiMachineHTTPHeader {
  /** The header name */
  name?: string
  /** The header value */
  values?: string[]
}

/**
 * An optional object that defines one or more named checks. The key for each
 * check is the check name.
 */
export interface ApiMachineCheck {
  /** The time to wait after a VM starts before checking its health */
  grace_period?: string
  headers?: ApiMachineHTTPHeader[]
  /** The time between connectivity checks */
  interval?: string
  /** For http checks, the HTTP method to use to when making the request */
  method?: string
  /** For http checks, the path to send the request to */
  path?: string
  /** The port to connect to, often the same as internal_port */
  port?: number
  /** For http checks, whether to use http or https */
  protocol?: string
  /**
   * The maximum time a connection can take before being reported as failing its
   * health check
   */
  timeout?: string
  /**
   * If the protocol is https, the hostname to use for TLS certificate
   * validation
   */
  tls_server_name?: string
  /**
   * For http checks with https protocol, whether or not to verify the TLS
   * certificate
   */
  tls_skip_verify?: boolean
  /** Tcp or http */
  type?: string
}

// oxfmt-ignore
export type Signal =
  | 'SIGABRT' | 'SIGALRM' | 'SIGFPE'  | 'SIGHUP'  | 'SIGILL'  | 'SIGINT'
  | 'SIGKILL' | 'SIGPIPE' | 'SIGQUIT' | 'SIGSEGV' | 'SIGTERM' | 'SIGTRAP'
  | 'SIGUSR1'
// oxfmt-ignore
export type Regions =
  | 'ams' | 'iad' | 'atl' | 'bog' | 'bos' | 'otp' | 'ord' | 'dfw' | 'den'
  | 'eze' | 'fra' | 'gdl' | 'hkg' | 'jnb' | 'lhr' | 'lax' | 'mad' | 'mia'
  | 'yul' | 'bom' | 'cdg' | 'phx' | 'qro' | 'gig' | 'sjc' | 'scl' | 'gru'
  | 'sea' | 'ewr' | 'sin' | 'arn' | 'syd' | 'nrt' | 'yyz' | 'waw'
// oxfmt-ignore
export type Endpoints =
  | 'cordon'   | 'events'   | 'exec'   | 'lease' | 'memory' | 'metadata' | 'ps'
  | 'reclaim'  | 'restart'  | 'signal' | 'start' | 'stop'   | 'suspend'
  | 'uncordon' | 'versions' | 'wait'

export interface MachineImageRef extends Omit<ApiImageRef, 'labels'> {
  digest: string
  labels: Record<string, string> | null
  registry: string
  repository: string
  tag: string
}

export interface MachineConfig extends ApiMachineConfig {
  // The Docker image to run
  image: string
  // Optionally one of hourly, daily, weekly, monthly. Runs machine at the given
  // interval. Interval starts at time of machine creation
  schedule?: 'hourly' | 'daily' | 'weekly' | 'monthly'
}

// `type` on purpose to avoid `Index signature for type is missing`
export type ListMachineReq<TSummary extends boolean> = {
  include_deleted?: boolean
  region?: string
  state?: MachineState
  // Only return summary info about machines (omit config, checks, events,
  // host_status, nonce, etc.)
  summary?: TSummary
}

/** @see {@link https://fly.io/docs/machines/api/machines-resource/#create-a-machine} */
export interface CreateMachineReq {
  config: MachineConfig
}

export interface BaseEvent {
  id: string
  source: 'flyd' | 'user' | 'proxy'
  status: string
  timestamp: number
  type: string
}

export interface LaunchEvent extends BaseEvent {
  status: 'created'
  type: 'launch' | 'uncordon' | 'cordon'
}

export interface StartEvent extends BaseEvent {
  status: 'started' | 'starting' | 'proxy'
  type: 'start' | 'uncordon' | 'cordon'
}

export interface SuspendEvent extends BaseEvent {
  status: 'suspended' | 'suspending'
  type: 'suspension' | 'uncordon' | 'cordon'
}

export interface RestartEvent extends BaseEvent {
  status: 'starting' | 'stopping'
  type: 'restart' | 'uncordon' | 'cordon'
}

export interface ExitEvent extends BaseEvent {
  request: {
    exit_event: {
      requested_stop: boolean
      restarting: boolean
      guest_exit_code: number
      guest_signal: number
      guest_error: string
      exit_code: number
      signal: number
      error: string
      oom_killed: boolean
      exited_at: string
    }
    restart_count: number
  }
  source: 'flyd'
  status: 'stopped'
  type: 'exit' | 'update'
}

export type MachineEvent =
  | LaunchEvent
  | StartEvent
  | RestartEvent
  | ExitEvent
  | SuspendEvent

export type VmSizes =
  | 'shared-cpu-1x'
  | 'shared-cpu-2x'
  | 'shared-cpu-4x'
  | 'shared-cpu-8x'
  | 'performance-1x'
  | 'performance-2x'
  | 'performance-4x'
  | 'performance-8x'
  | 'performance-16x'
  | 'a10'
  | 'a100-40gb'
  | 'a100-80gb'
  | 'l40s'

export interface MachineRes extends Omit<ApiMachine, 'image_ref'> {
  checks: CheckStatus[]
  config: {
    env: Record<string, string>
    init: ApiMachineInit
    mounts: MachineMount[]
    services: MachineService[]
    checks: Record<string, MachineCheck>
    restart: ApiMachineRestart
    guest: MachineGuest
    size: VmSizes
  } & MachineConfig
  created_at: string
  events: MachineEvent[]
  id: string
  image_ref: MachineImageRef
  instance_id: string
  name: string
  private_ip: string
  region: Regions
  state: MachineState
  updated_at: string
}

export type SummaryMachineRes = Omit<
  MachineRes,
  'config' | 'checks' | 'events' | 'host_status' | 'nonce'
>

// With this generic we can have a correct return type
export type ListRes<TSummary> = TSummary extends true
  ? SummaryMachineRes
  : MachineRes

export type MachineState =
  | 'created'
  | 'destroyed'
  | 'destroying'
  | 'replacing'
  | 'started'
  | 'starting'
  | 'stopped'
  | 'stopping'
  | 'suspended'
  | 'suspending'

export interface MachineMount extends ApiMachineMount {
  encrypted: boolean
  name: string
  /** Absolute path on the VM where the volume should be mounted. i.e. /data */
  path: string
  size_gb: number
  /** The volume ID, visible in fly volumes list, i.e. vol_2n0l3vl60qpv635d */
  volume: string
}

type ConnectionHandler =
  // Convert TLS connection to unencrypted TCP
  | 'tls'
  // Handle TLS for PostgreSQL connections
  | 'pg_tls'
  // Convert TCP connection to HTTP
  | 'http'
  // Wrap TCP connection in PROXY protocol
  | 'proxy_proto'

export interface MachinePort extends ApiMachinePort {
  // Array of connection handlers for TCP-based services.
  handlers?: ConnectionHandler[]
  // Public-facing port number
  port: number
}

export interface MachineService extends ApiMachineService {
  // Load balancing concurrency settings
  concurrency?: {
    // Connections (TCP) or requests (HTTP). Defaults to connections.
    type: 'connections' | 'requests'
    // "ideal" service concurrency. We will attempt to spread load to keep
    // services at or below this limit
    soft_limit: number
    // Maximum allowed concurrency. We will queue or reject when a service is at
    // this limit
    hard_limit: number
  }
  internal_port: number
  ports: MachinePort[]
  protocol: 'tcp' | 'udp'
}

export interface MachineCheck extends ApiMachineCheck {
  // The time between connectivity checks
  interval: string
  // The port to connect to, likely should be the same as internal_port
  port: number
  // The maximum time a connection can take before being reported as failing its
  // healthcheck
  timeout: string
  // tcp or http
  type: 'tcp' | 'http'
}

export interface MachineGuest extends ApiMachineGuest {
  cpu_kind: 'shared' | 'performance'
  cpus: number
  memory_mb: number
}

export interface CheckStatus extends ApiCheckStatus {
  name: string
  output: string
  status: 'passing' | 'warning' | 'critical'
  updated_at: string
}

export interface GetMachineReq {
  machineId: string
}

export interface Timeout {
  'time.Duration': number
}

export interface RestartMachineReq extends GetMachineReq {
  timeout?: Timeout
}

export interface StopMachineReq extends RestartMachineReq {
  /**
   * Signal to stop the machine with. Default value: SIGINT
   *
   * @default SIGINT
   */
  signal?: Signal
}

export type StartMachineReq = GetMachineReq

export interface SuspendMachineReq extends GetMachineReq {}

export interface OkRes {
  ok: boolean
}

export interface DeleteMachineReq extends GetMachineReq {
  // If true, the machine will be deleted even if it is in any other state than
  // running
  force?: boolean
}

export interface UpdateMachineReq extends GetMachineReq {
  config: MachineConfig
  currentVersion?: string
  leaseTtl?: number
  lsvd?: boolean
  name?: string
  region?: Regions
  skipLaunch?: boolean
  skipServiceRegistration?: boolean
}

export interface WaitMachineReq extends GetMachineReq {
  instance_id: string
  state?: WaitState
  /** @default 60 (seconds) */
  timeout?: string
}

export type GetLeaseReq = GetMachineReq

export interface LeaseRes {
  data: {
    description: string
    expires_at: number
    nonce: string
    owner: string
    version: string
  }
  status: 'success'
}

export interface CreateLeaseReq extends GetLeaseReq {
  description?: string
  ttl: number
}

export interface DeleteLeaseReq extends GetLeaseReq {
  nonce: string
}

export type CordonMachineReq = GetMachineReq

export type UncordonMachineReq = GetMachineReq

export type GetMetadataMachineReq = GetMachineReq

export interface GetMetadataValMachineReq extends GetMachineReq {
  key: string
}

export interface GetMetadataValMachineRes {
  value: string
}

export type GetMemoryReq = GetMachineReq

export interface SetMemoryReq extends GetMachineReq {
  limit_mb: number
}

export interface ReclaimMemoryReq extends GetMachineReq {
  amount_mb: number
}

export type ReclaimMemoryRes = {
  actual_mb: number
}

export type MemoryRes = {
  available_mb: number
  limit_mb: number
}

export interface SetMetadataMachineReq extends GetMachineReq {
  key: string
  value: Record<string, string>
}

export interface UpsertMetadataMachineReq extends GetMachineReq {
  key: string
  updated_at: string
  value: string
}

export interface UpdateMetadataMachineReq extends GetMachineReq {
  machine_version?: string
  metadata: Record<string, string>
  updated_at: string
}

export type DeleteMachineMetadataReq = SetMetadataMachineReq

export interface GetMetadataRes {
  [key: string]: string
}

export type ListMachineVersionsReq = GetMachineReq

export interface SignalMachineReq extends GetMachineReq {
  signal: Signal
}

export interface ListProcessesReq extends GetMachineReq {
  order?: string
  sortBy?: string
}

export interface ProcessRes {
  command: string
  cpu: number
  directory: string
  listen_sockets: [
    {
      address: string
      proto: string
    },
  ]
  pid: number
  rss: number
  rtime: number
  stime: number
}

// TODO: this should also take limit but the docs don't mention it
// export interface ListEventsReq extends GetMachineReq {
//   limit?: number
// }
export type ListEventsReq = GetMachineReq

export interface ExecMachineReq extends GetMachineReq {
  /** @deprecated Use `command` instead */
  cmd?: string
  command: string[]
  container?: string
  stdin?: string
  timeout?: number
}

export interface ExecMachineRes {
  exit_code: number
  exit_signal: number
  stderr: string
  stdout: string
}

export interface MachineVersionRes {
  user_config?: ApiMachineConfig
  version?: string
}

// ============================================
// Error types
// ============================================

/** Error thrown when the server returns a 4xx or 5xx response. */
export class FlyApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message)
    this.name = 'FlyApiError'
  }
}

/** 400 Bad Request - Invalid request parameters or body */
export interface BadRequestError {
  message: string
  fields?: Record<string, string[]>
}

/** 401 Unauthorized - Invalid or missing token */
export interface UnauthorizedError {
  message: string
}

/** 404 Not Found - Machine or resource not found */
export interface NotFoundError {
  message: string
}

/** 409 Conflict - Resource conflict (e.g., lease held by another process) */
export interface ConflictError {
  message: string
}

/** 412 Precondition Failed - Version mismatch on optimistic locking */
export interface PreconditionFailedError {
  message: string
}

/** 429 Too Many Requests - Rate limit exceeded */
export interface RateLimitError {
  message: string
}

/** 500 Internal Server Error - Server-side error */
export interface InternalServerError {
  message: string
}
