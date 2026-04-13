import type {
  CheckStatus as ApiCheckStatus,
  ImageRef as ApiImageRef,
  Machine as ApiMachine,
  ApiMachineCheck,
  ApiMachineConfig,
  ApiMachineGuest,
  ApiMachineInit,
  ApiMachineMount,
  ApiMachinePort,
  ApiMachineRestart,
  ApiMachineService,
  WaitState,
} from './fly.types.ts'

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

// Ref: https://fly.io/docs/machines/api/machines-resource/#create-a-machine
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
  // Absolute path on the VM where the volume should be mounted. i.e. /data
  path: string
  size_gb: number
  // The volume ID, visible in fly volumes list, i.e. vol_2n0l3vl60qpv635d
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
   * @defaultValue SIGINT
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
  // Default timeout is 60 (seconds)
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

export type GetMemoryReq = GetMachineReq

// export type ReclaimMemoryReq = GetMachineReq

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
  fly_flyctl_version: string
  fly_platform_version: string
  fly_process_group: string
  fly_release_id: string
  fly_release_version: string
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
  command?: string[]
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
