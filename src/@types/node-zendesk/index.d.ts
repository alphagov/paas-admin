declare module 'node-zendesk' {
  // Type definitions for node-zendesk 2.0
  // Project: https://github.com/blakmatrix/node-zendesk
  // Definitions by: jgeth <https://github.com/jgeth>
  // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
  // TypeScript Version: 3.0

  /// <reference types="node"/>

  import { PathLike } from 'fs'

  export type ZendeskCallback<TResponse, TResult> = (
    error: Error | undefined,
    response: TResponse,
    result: TResult
  ) => void

  export interface Client {
    readonly accountsettings: unknown
    readonly activitystream: unknown
    readonly attachments: Attachments.Methods
    readonly brand: unknown
    readonly categories: unknown
    readonly customagentroles: unknown
    readonly dynamiccontent: unknown
    readonly forums: unknown
    readonly forumsubscriptions: unknown
    readonly groupmemberships: unknown
    readonly groups: unknown
    readonly helpers: unknown
    readonly imports: unknown
    readonly installations: unknown
    readonly jobstatuses: JobStatuses.Methods
    readonly locales: unknown
    readonly macros: Macros.Methods
    readonly oauthtokens: unknown
    readonly organizationfields: unknown
    readonly organizationmemberships: unknown
    readonly organizations: unknown
    readonly policies: unknown
    readonly requests: Requests.Methods
    readonly satisfactionratings: unknown
    readonly search: unknown
    readonly sessions: unknown
    readonly sharingagreement: unknown
    readonly suspendedtickets: unknown
    readonly tags: unknown
    readonly targets: unknown
    readonly ticketaudits: unknown
    readonly ticketevents: unknown
    readonly ticketexport: unknown
    readonly ticketfields: unknown
    readonly ticketforms: unknown
    readonly ticketimport: unknown
    readonly ticketmetrics: unknown
    readonly tickets: Tickets.Methods
    readonly topiccomments: unknown
    readonly topics: unknown
    readonly topicsubscriptions: unknown
    readonly topicvotes: unknown
    readonly triggers: unknown
    readonly userfields: Users.Fields.Methods
    readonly useridentities: Users.Identities.Methods
    readonly users: Users.Methods
    readonly views: unknown
  }

  export interface ClientOptions {
    readonly username: string
    readonly token: string
    readonly remoteUri: string
    readonly oauth?: boolean
    readonly debug?: boolean
    readonly disableGlobalState?: boolean
    readonly asUser?: string
  }

  export function createClient (config: ClientOptions): Client

  export namespace Attachments {
    interface Methods {
      request(httpMethod: string, fields: unknown, config: unknown, cb: ZendeskCallback<unknown, unknown>): unknown
      request(httpMethod: string, fields: unknown, config: unknown): Promise<unknown>

      upload(
        file: PathLike,
        fileOptions: {
          readonly filename: string
          readonly token?: string
        },
        cb: ZendeskCallback<unknown, unknown>
      ): void
      upload(
        file: PathLike,
        fileOptions: {
          readonly filename: string
          readonly token?: string
        }
      ): Promise<void>
    }

    interface Photo extends PersistableModel {
      readonly url: string
      readonly file_name: string
      readonly content_url: string
      readonly content_type: string
      readonly size: number
      readonly width: number
      readonly height: number
      readonly inline: boolean
    }

    interface Model extends Photo {
      readonly thumbnails: readonly Photo[]
    }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/job_statuses|Zendesk Job Statuses}
   */
  export namespace JobStatuses {
    interface Methods {
      show(jobStatusId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      show(jobStatusId: ZendeskID): Promise<ResponsePayload>
      watch(
        jobStatusId: ZendeskID,
        interval: number,
        maxAttempts: number,
        cb: ZendeskCallback<unknown, unknown>
      ): unknown
      watch(
        jobStatusId: ZendeskID,
        interval: number,
        maxAttempts: number
      ): Promise<unknown>
    }

      type Status = 'queued' | 'working' | 'failed' | 'completed' | 'killed'

      interface Result extends PersistableModel {
        readonly action: string
        readonly success: boolean
        readonly status: string
      }

      interface ResponseModel extends PersistableModel {
        readonly url?: string | null
        readonly total?: number
        readonly progress?: number
        readonly status?: Status
        readonly message?: string | null
        readonly results?: readonly Result[]
      }

      interface ResponsePayload {
        readonly job_status: ResponseModel
      }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/macros|Zendesk Macros}
   */
  export namespace Macros {
    interface Methods {
      applyTicket(
        ticketId: ZendeskID,
        macroId: number,
        cb: ZendeskCallback<unknown, unknown>
      ): ApplyTicketResponsePayload
      applyTicket(
        ticketId: ZendeskID,
        macroId: number
      ): Promise<ApplyTicketResponsePayload>
    }

    interface ApplyTicketResponsePayload {
      readonly result: {
        readonly ticket: Tickets.CreateModel
        readonly comment: {
          readonly body: string
          readonly html_body: string
          readonly scoped_body?: unknown
          readonly public?: boolean
        }
      }
    }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/organizations|Zendesk Organizations}
   */
  export namespace Organizations {
    interface Model extends AuditableModel {
      readonly url?: string
      readonly external_id?: string | null
      readonly name: string
      readonly domain_names?: readonly string[]
      readonly details?: string | null
      readonly notes?: string | null
      readonly group_id?: number | null
      readonly shared_tickets?: boolean
      readonly shared_comments?: boolean
      readonly tags?: readonly string[]
      readonly organization_fields?: object | null
    }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/requests|Zendesk Requests}
   */
  export namespace Requests {
    interface Methods {
      /** Listing Requests */
      list(cb: ZendeskCallback<unknown, unknown>): ListPayload
      list(): Promise<ListPayload>
      listOpen(cb: ZendeskCallback<unknown, unknown>): ListPayload
      listOpen(): Promise<ListPayload>
      listSolved(cb: ZendeskCallback<unknown, unknown>): ListPayload
      listSolved(): Promise<ListPayload>
      listCCD(organizationId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listCCD(organizationId: ZendeskID): Promise<ListPayload>
      listByUser(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByUser(userId: ZendeskID): Promise<ListPayload>
      listByOrganization(organizationId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByOrganization(organizationId: ZendeskID): Promise<ListPayload>

      /** Viewing Requests */
      getRequest(requestId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      getRequest(requestId: ZendeskID): Promise<ResponsePayload>

      /** Creating Requests */
      create(request: CreatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      create(request: CreatePayload): Promise<ResponsePayload>

      /** Updating Requests */
      update(requestId: ZendeskID, request: UpdatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      update(requestId: ZendeskID, request: UpdatePayload): Promise<ResponsePayload>

      /** Listing Comments */
      listComments(requestId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): Comments.ListPayload
      listComments(requestId: ZendeskID): Promise<Comments.ListPayload>

      /** Get Comment */
      getComment(
        requestId: ZendeskID,
        commentId: ZendeskID,
        cb: ZendeskCallback<unknown, unknown>
      ): Comments.ResponsePayload
      getComment(
        requestId: ZendeskID,
        commentId: ZendeskID
      ): Promise<Comments.ResponsePayload>

      /** Inherited */
      requestAll(httpMethod: string, fields: unknown, cb: ZendeskCallback<unknown, unknown>): ListPayload
      requestAll(httpMethod: string, fields: unknown): Promise<ListPayload>
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/requests#create-request|Zendesk Requests Create}
       */
    interface CreateModel {
      readonly requester?: RequesterAnonymous; // Required for anonymous requests
      readonly subject: string
      readonly comment: Comments.CreateModel
      readonly priority?: Tickets.Priority | null; // Anonymous requests can set priority, Authenticated requests cannot
      readonly type?: Tickets.TicketType | null; // Anonymous requests can set type, Authenticated requests cannot
      readonly custom_fields?: readonly Tickets.Field[] | null
      readonly fields?: readonly Tickets.Field[] | null
      readonly due_at?: string | null; // Anonymous requests can set due date as long as type == task. Authenticated requests cannot
      readonly ticket_form_id?: number | null
      readonly recipient?: string | null
      readonly collaborators?: readonly ZendeskID[] | readonly string[] | readonly Collaborator[]
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/requests#update-request|Zendesk Requests Update}
       */
    interface UpdateModel {
      readonly comment?: Comments.CreateModel
      readonly solved?: boolean
      readonly additional_collaborators?: readonly ZendeskID[] | readonly string[] | readonly Collaborator[]
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/requests#json-format|Zendesk Requests JSON Format}
       */
    interface ResponseModel extends AuditableModel {
      readonly url: string
      readonly subject: string
      readonly description: string
      readonly status: Tickets.Status
      readonly priority: Tickets.Priority | null
      readonly type: Tickets.TicketType | null
      readonly custom_fields: readonly Tickets.Field[] | null
      readonly fields: readonly Tickets.Field[] | null
      readonly organization_id: ZendeskID | null
      readonly requester_id: ZendeskID
      readonly assignee_id: ZendeskID | null
      readonly group_id?: ZendeskID | null
      readonly collaborator_ids: readonly ZendeskID[]
      readonly email_cc_ids: readonly ZendeskID[]
      readonly via: Tickets.Via
      readonly is_public: boolean
      readonly due_at: string | null
      readonly can_be_solved_by_me?: boolean
      readonly solved?: boolean
      readonly ticket_form_id?: number | null
      readonly recipient: string | null
      readonly followup_source_id: string | null
    }

    interface RequesterAnonymous {
      readonly name: string
      readonly email?: string
      readonly locale_id?: ZendeskID
    }

    interface Collaborator {
      readonly name?: string
      readonly email: string
    }

    interface CreatePayload {
      readonly request: CreateModel
    }

    interface UpdatePayload {
      readonly request: UpdateModel
    }

    interface ResponsePayload {
      readonly request: ResponseModel
    }

    interface ListPayload extends PaginablePayload {
      readonly requests: readonly ResponseModel[]
    }

    namespace Comments {
      interface CreateModel {
        readonly url?: string
        readonly request_id?: number
        readonly body?: string
        readonly html_body?: string
        readonly public?: boolean
        readonly author_id?: ZendeskID
        readonly uploads?: readonly string[]
      }

      interface ResponseModel extends TemporalModel {
        readonly url: string
        readonly type: RequestType
        readonly request_id: number
        readonly body: string
        readonly html_body: string
        readonly plain_body: string
        readonly public: boolean
        readonly author_id: ZendeskID
        readonly attachments: readonly Attachments.Model[]
        readonly via?: Tickets.Via
        readonly metadata?: Tickets.Comments.Metadata
      }

          type RequestType = 'Comment' | 'VoiceComment'

          namespace CommentsUsers {
            interface ResponseModel extends PersistableModel {
              readonly name: string
              readonly photo: Attachments.Model | null
              readonly agent: boolean
              readonly organization_id: number | null
            }
          }

          interface ListPayload extends PaginablePayload {
            readonly comments: readonly ResponseModel[]
            readonly users: readonly CommentsUsers.ResponseModel[]
            readonly organizations: readonly Tickets.Comments.Organizations.ResponseModel[]
          }

          interface ResponsePayload {
            readonly comment: ResponseModel
          }
    }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/tickets|Zendesk Tickets}
   */
  export namespace Tickets {
    interface Methods {
      /** Listing Tickets */
      list(cb: ZendeskCallback<unknown, unknown>): ListPayload
      list(): Promise<ListPayload>
      listAssigned(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listAssigned(userId: ZendeskID): Promise<ListPayload>
      listByOrganization(organizationId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByOrganization(organizationId: ZendeskID): Promise<ListPayload>
      listByUserRequested(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByUserRequested(userId: ZendeskID): Promise<ListPayload>
      listByUserCCD(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByUserCCD(userId: ZendeskID): Promise<ListPayload>
      listWithFilter(type: string, value: unknown, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listWithFilter(type: string, value: unknown): Promise<ListPayload>
      listRecent(cb: ZendeskCallback<unknown, unknown>): ListPayload
      listRecent(): Promise<ListPayload>
      listCollaborators(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): Users.ListPayload
      listCollaborators(ticketId: ZendeskID): Promise<Users.ListPayload>
      listIncidents(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listIncidents(ticketId: ZendeskID): Promise<ListPayload>
      listMetrics(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): Metrics.ResponsePayload
      listMetrics(ticketId: ZendeskID): Promise<Metrics.ResponsePayload>

      /** Viewing Tickets */
      show(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      show(ticketId: ZendeskID): Promise<ResponsePayload>
      showMany(ticketIds: readonly ZendeskID[], cb: ZendeskCallback<unknown, unknown>): ListPayload
      showMany(ticketIds: readonly ZendeskID[]): Promise<ListPayload>

      /** Creating Tickets */
      create(ticket: CreatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      create(ticket: CreatePayload): Promise<ResponsePayload>
      createMany(tickets: CreateManyPayload, cb: ZendeskCallback<unknown, unknown>): JobStatuses.ResponsePayload
      createMany(tickets: CreateManyPayload): Promise<JobStatuses.ResponsePayload>

      /** Updating Tickets */
      update(ticketId: ZendeskID, ticket: UpdatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      update(ticketId: ZendeskID, ticket: UpdatePayload): Promise<ResponsePayload>
      updateMany(tickets: UpdateManyPayload, cb: ZendeskCallback<unknown, unknown>): JobStatuses.ResponsePayload
      updateMany(tickets: UpdateManyPayload): Promise<JobStatuses.ResponsePayload>

      /** Deleting Tickets */
      delete(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): unknown
      delete(ticketId: ZendeskID): Promise<unknown>
      deleteMany(ticketIds: readonly ZendeskID[], cb: ZendeskCallback<unknown, unknown>): unknown
      deleteMany(ticketIds: readonly ZendeskID[]): Promise<unknown>

      /** Merging Tickets */
      merge(
        ticketId: ZendeskID,
        mergingTickets: MergePayload,
        cb: ZendeskCallback<unknown, unknown>
      ): JobStatuses.ResponsePayload
      merge(
        ticketId: ZendeskID,
        mergingTickets: MergePayload
      ): Promise<JobStatuses.ResponsePayload>

      /** Ticket Exports */
      export(startTime: number, cb: ZendeskCallback<unknown, unknown>): unknown
      export(startTime: number): Promise<unknown>
      exportSample(startTime: number, options: unknown): unknown
      incremental(startTime: number, cb: ZendeskCallback<unknown, unknown>): unknown
      incremental(startTime: number): Promise<unknown>
      incrementalInclude(startTime: number, include: unknown, cb: ZendeskCallback<unknown, unknown>): unknown
      incrementalInclude(startTime: number, include: unknown): Promise<unknown>
      incrementalSample(startTime: number, cb: ZendeskCallback<unknown, unknown>): unknown
      incrementalSample(startTime: number): Promise<unknown>

      /** Listing Comments */
      getComments(requestId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): Comments.ListPayload
      getComments(requestId: ZendeskID): Promise<Comments.ListPayload>

      /** Listing Audits */
      exportAudit(ticketId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): AuditsListPayload
      exportAudit(ticketId: ZendeskID): Promise<AuditsListPayload>

      /** Adding Tags */
      addTags(ticketId: ZendeskID, tags: readonly string[], cb: ZendeskCallback<unknown, unknown>): TagsPayload
      addTags(ticketId: ZendeskID, tags: readonly string[]): Promise<TagsPayload>
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/tickets#create-ticket|Zendesk Tickets Create}
       */
    interface CreateModel {
      readonly comment: Requests.Comments.CreateModel
      readonly external_id?: string | null
      readonly type?: TicketType | null
      readonly subject?: string | null
      readonly raw_subject?: string | null
      readonly priority?: Priority | null
      readonly status?: Status | null
      readonly recipient?: string | null
      readonly requester_id?: ZendeskID
      readonly submitter_id?: ZendeskID | null
      readonly assignee_id?: ZendeskID | null
      readonly organization_id?: number | null
      readonly group_id?: number | null
      readonly collaborator_ids?: readonly number[] | null
      readonly collaborators?: readonly any[] | null
      readonly follower_ids?: readonly number[] | null
      readonly email_cc_ids?: readonly number[] | null
      readonly forum_topic_id?: number | null
      readonly problem_id?: number | null
      readonly due_at?: string | null
      readonly tags?: readonly string[] | null
      readonly custom_fields?: readonly Field[] | null
      readonly fields?: readonly Field[] | null
      readonly via_followup_source_id?: number | null
      readonly macro_ids?: readonly number[] | null
      readonly ticket_form_id?: number | null
      readonly brand_id?: number | null
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/tickets#update-ticket|Zendesk Tickets Update}
       */
    interface UpdateModel {
      readonly subject?: string | null
      readonly comment?: Requests.Comments.CreateModel
      readonly requester_id?: ZendeskID
      readonly assignee_id?: ZendeskID | null
      readonly assignee_email?: string | null
      readonly group_id?: number | null
      readonly organization_id?: number | null
      readonly collaborator_ids?: readonly number[] | null
      readonly additional_collaborators?: readonly any[] | null
      readonly followers?: readonly Follower[] | null
      readonly email_ccs?: readonly EmailCC[] | null
      readonly type?: TicketType | null
      readonly priority?: Priority | null
      readonly status?: Status | null
      readonly tags?: readonly string[] | null
      readonly external_id?: string | null
      readonly problem_id?: number | null
      readonly due_at?: string | null
      readonly custom_fields?: readonly Field[] | null
      readonly updated_stamp?: string | null
      readonly safe_update?: boolean
      readonly sharing_agreement_ids?: readonly number[] | null
      readonly macro_ids?: readonly number[] | null
      readonly attribute_value_ids?: readonly number[] | null
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/tickets#json-format|Zendesk Tickets JSON Format}
       */
    interface ResponseModel extends AuditableModel {
      readonly url: string
      readonly external_id: string | null
      readonly type: TicketType | null
      readonly subject: string | null
      readonly raw_subject: string | null
      readonly description: string
      readonly priority: Priority | null
      readonly status: Status
      readonly recipient: string | null
      readonly requester_id: ZendeskID
      readonly submitter_id: ZendeskID
      readonly assignee_id: ZendeskID | null
      readonly organization_id: number
      readonly group_id: number | null
      readonly collaborator_ids: readonly number[]
      readonly follower_ids: readonly number[]
      readonly email_cc_ids: readonly number[]
      readonly forum_topic_id: number | null
      readonly problem_id: number | null
      readonly has_incidents: boolean
      readonly due_at: string | null
      readonly tags: readonly string[]
      readonly via: Via
      readonly custom_fields: readonly Field[]
      readonly fields: readonly Field[]
      readonly satisfaction_rating: object | string | null
      readonly sharing_agreement_ids: readonly number[]
      readonly followup_ids: readonly number[]
      readonly ticket_form_id?: number | null; // Enterprise version only
      readonly brand_id?: number | null; // Enterprise version only
      readonly allow_channelback: boolean
      readonly allow_attachments: boolean
      readonly is_public: boolean
      readonly comment_count?: number
    }

    interface Audit {
      readonly id: ZendeskID
      readonly ticket_id: ZendeskID
      readonly metadata: unknown | null
      readonly via: Via | null
      readonly created_at: string
      readonly author_id: ZendeskID
      readonly events: readonly unknown[] | null
    }

    interface EmailCC {
      readonly user_id?: ZendeskID
      readonly user_email?: string
      readonly action: string
    }

    interface Field {
      readonly id: number
      readonly value: any
    }

    interface Follower {
      readonly user_id?: ZendeskID
      readonly user_email?: string
      readonly action: string
    }

      type Priority = 'urgent' | 'high' | 'normal' | 'low'

      type Status = 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'

      type TicketType = 'problem' | 'incident' | 'question' | 'task'

      interface Via {
        readonly channel: ViaChannel
        readonly source: ViaSource
      }

      type ViaChannel = 'api' | 'web' | 'mobile' | 'rule' | 'system'

      interface ViaSource {
        readonly to: object
        readonly from: object
        readonly rel: string | null
      }

      interface CreatePayload {
        readonly ticket: CreateModel
      }

      interface CreateManyPayload {
        readonly tickets: readonly CreateModel[]
      }

      interface UpdatePayload {
        readonly ticket: UpdateModel
      }

      interface UpdateManyPayload {
        readonly tickets: readonly UpdateModel[]
      }

      interface MergePayload {
        readonly ids: readonly ZendeskID[]
        readonly target_comment?: string | null
        readonly source_comment?: string | null
      }

      interface AuditsListPayload extends PaginablePayload {
        readonly audits: readonly Audit[]
      }

      interface TagsPayload {
        readonly tags: readonly string[]
      }

      interface ResponsePayload {
        readonly ticket: ResponseModel
        readonly audit: Audit
      }

      interface ListPayload extends PaginablePayload {
        readonly tickets: readonly ResponseModel[]
      }

      namespace Comments {
        interface ResponseModel extends Requests.Comments.ResponseModel {
          readonly via?: Via
          readonly metadata?: Metadata
        }

        interface Metadata {
          readonly flags?: readonly number[]
          readonly flag_options: unknown
        }

        interface ListPayload extends PaginablePayload {
          readonly comments: readonly ResponseModel[]
        }

        namespace CommentsUsers {
          interface ResponseModel extends Requests.Comments.CommentsUsers.ResponseModel {
            readonly role: Users.Role
          }
        }

        namespace Organizations {
          interface ResponseModel extends PersistableModel {
            readonly name: string
          }
        }
      }

      namespace Metrics {
        interface MinutesObject {
          readonly calendar: number
          readonly business: number
        }

        interface ResponseModel extends AuditableModel {
          readonly ticket_id?: ZendeskID
          readonly url?: string
          readonly group_stations?: number
          readonly assignee_stations?: number
          readonly reopens?: number
          readonly replies?: number
          readonly assignee_updated_at?: string | null
          readonly requester_updated_at?: string | null
          readonly initially_assigned_at?: string | null
          readonly assigned_at?: string | null
          readonly solved_at?: string | null
          readonly latest_comment_added_at?: string | null
          readonly first_resolution_time_in_minutes?: MinutesObject
          readonly reply_time_in_minutes?: MinutesObject
          readonly full_resolution_time_in_minutes?: MinutesObject
          readonly agent_wait_time_in_minutes?: MinutesObject
          readonly requester_wait_time_in_minutes?: MinutesObject
        }

        interface ResponsePayload {
          readonly ticket_metric: ResponseModel
        }

        interface ListPayload {
          readonly ticket_metrics: readonly ResponseModel[]
        }
      }
  }

  /**
   * @see {@link https://developer.zendesk.com/rest_api/docs/support/users|Zendesk Users}
   */
  export namespace Users {
    interface Methods {
      /** User Auth */
      auth(cb: ZendeskCallback<unknown, unknown>): unknown
      auth(): Promise<unknown>

      /** Listing Users */
      list(cb: ZendeskCallback<unknown, unknown>): ListPayload
      list(): Promise<ListPayload>
      listByGroup(groupId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByGroup(groupId: ZendeskID): Promise<ListPayload>
      listByOrganization(organizationId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
      listByOrganization(organizationId: ZendeskID): Promise<ListPayload>

      /** Showing Users */
      show(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      show(userId: ZendeskID): Promise<ResponsePayload>
      showMany(userIds: readonly ZendeskID[], cb: ZendeskCallback<unknown, unknown>): ListPayload
      showMany(userIds: readonly ZendeskID[]): Promise<ListPayload>

      /** Creating Users */
      create(user: CreatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      create(user: CreatePayload): Promise<ResponsePayload>
      createMany(users: CreateManyPayload, cb: ZendeskCallback<unknown, unknown>): JobStatuses.ResponsePayload
      createMany(users: CreateManyPayload): Promise<JobStatuses.ResponsePayload>
      createOrUpdate(user: CreatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      createOrUpdate(user: CreatePayload): Promise<ResponsePayload>
      createOrUpdateMany(
        users: CreateManyPayload,
        cb: ZendeskCallback<unknown, unknown>
      ): JobStatuses.ResponsePayload
      createOrUpdateMany(
        users: CreateManyPayload
      ): Promise<JobStatuses.ResponsePayload>

      /** Updating Users */
      update(userId: ZendeskID, user: UpdatePayload, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      update(userId: ZendeskID, user: UpdatePayload): Promise<ResponsePayload>
      updateMany(
        userIds: UpdateIdPayload,
        users: UpdateManyPayload,
        cb: ZendeskCallback<unknown, unknown>
      ): JobStatuses.ResponsePayload
      updateMany(
        userIds: UpdateIdPayload,
        users: UpdateManyPayload
      ): Promise<JobStatuses.ResponsePayload>

      /** Suspending Users */
      suspend(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      suspend(userId: ZendeskID): Promise<ResponsePayload>
      unsuspend(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      unsuspend(userId: ZendeskID): Promise<ResponsePayload>

      /** Deleting Users */
      delete(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): unknown
      delete(userId: ZendeskID): Promise<unknown>

      /** Searching Users */
      search(params: unknown, cb: ZendeskCallback<unknown, unknown>): ListPayload
      search(params: unknown): Promise<ListPayload>

      /** Getting own User */
      me(cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      me(): Promise<ResponsePayload>

      /** Merging Users */
      merge(userId: ZendeskID, targetUserId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
      merge(userId: ZendeskID, targetUserId: ZendeskID): Promise<ResponsePayload>

      /** Changing User Password */
      password(
        userId: ZendeskID,
        oldPassword: string,
        newPassword: string,
        cb: ZendeskCallback<unknown, unknown>
      ): unknown
      password(
        userId: ZendeskID,
        oldPassword: string,
        newPassword: string
      ): Promise<unknown>

      /** Users Export */
      incrementalInclude(startTime: number, include: unknown, cb: ZendeskCallback<unknown, unknown>): ListPayload
      incrementalInclude(startTime: number, include: unknown): Promise<ListPayload>
      incremental(startTime: number, cb: ZendeskCallback<unknown, unknown>): ListPayload
      incremental(startTime: number): Promise<ListPayload>
      incrementalSample(startTime: number, cb: ZendeskCallback<unknown, unknown>): ListPayload
      incrementalSample(startTime: number): Promise<ListPayload>
    }

    interface BaseModel {
      readonly email?: string | null
      readonly alias?: string | null
      readonly custom_role_id?: number | null
      readonly details?: string | null
      readonly external_id?: string | null
      readonly locale_id?: number | null
      readonly moderator?: boolean | null
      readonly notes?: string | null
      readonly only_private_comments?: boolean | null
      readonly organization_id?: number | null
      readonly default_group_id?: number | null
      readonly phone?: string | null
      readonly photo?: Attachments.Model | null
      readonly restricted_agent?: boolean | null
      readonly role?: Role | null
      readonly signature?: string | null
      readonly suspended?: boolean | null
      readonly tags?: readonly unknown[] | null
      readonly ticket_restriction?: TicketRestriction | null
      readonly time_zone?: string | null
      readonly user_fields?: object | null
      readonly verified?: boolean | null
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/users#create-user|Zendesk Users Create}
       */
    interface CreateModel extends BaseModel {
      readonly name: string
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/users#update-user|Zendesk Users Update}
       */
    interface UpdateModel extends BaseModel {
      readonly name?: string
    }

    /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/users#json-format-for-agent-or-admin-requests|Zendesk Users JSON Format}
       */
    interface ResponseModel extends AuditableModel {
      readonly email: string | null
      readonly name: string
      readonly active: boolean
      readonly alias: string | null
      readonly chat_only: boolean
      readonly custom_role_id: number | null
      readonly role_type: RoleType
      readonly details: string | null
      readonly external_id: string | null
      readonly last_login_at: string | null
      readonly locale: string | null
      readonly locale_id: number | null
      readonly moderator: boolean
      readonly notes: string | null
      readonly only_private_comments: boolean
      readonly organization_id: number | null
      readonly default_group_id: number | null
      readonly phone: string | null
      readonly shared_phone_number: boolean | null
      readonly photo: Attachments.Model | null
      readonly restricted_agent: boolean
      readonly role: Role
      readonly shared: boolean
      readonly shared_agent: boolean
      readonly signature: string | null
      readonly suspended: boolean
      readonly tags?: readonly unknown[] | null
      readonly ticket_restriction: TicketRestriction | null
      readonly time_zone: string | null
      readonly two_factor_auth_enabled: boolean
      readonly url: string
      readonly user_fields?: object | null
      readonly verified: boolean
      readonly report_csv: boolean
    }

      type UpdateIdPayload =
          | string
          | readonly ZendeskID[]
          | { readonly ids: readonly ZendeskID[] }
          | { readonly external_ids: readonly ZendeskID[] }

      interface CreatePayload {
        readonly user: CreateModel
      }

      interface CreateManyPayload {
        readonly users: readonly CreateModel[]
      }

      interface UpdatePayload {
        readonly user: UpdateModel
      }

      interface UpdateManyPayload {
        readonly users: readonly UpdateModel[]
      }

      interface ResponsePayload {
        readonly user: ResponseModel
      }

      interface ListPayload extends PaginablePayload {
        readonly users: readonly ResponseModel[]
      }

      type Role = 'admin' | 'agent' | 'end-user'

      /**
       * Defines an agent type
       * 0 - Custom
       * 1 - Light
       * 2 - Chat
       */
      type RoleType = 0 | 1 | 2

      type TicketRestriction = 'assigned' | 'groups' | 'organization' | 'requested'

      /**
       * @see {@link https://developer.zendesk.com/rest_api/docs/support/user_identities|Zendesk User Identities}
       */
      namespace Identities {
        interface Methods {
          /** Listing Identities */
          list(userId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
          list(userId: ZendeskID): Promise<ListPayload>

          /** Viewing Identities */
          show(userId: ZendeskID, identityId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
          show(userId: ZendeskID, identityId: ZendeskID): Promise<ResponsePayload>

          /** Creating Identities */
          create(userId: ZendeskID, identity: CreatePayload, cb: ZendeskCallback<unknown, unknown>): ResponseModel
          create(userId: ZendeskID, identity: CreatePayload): Promise<ResponseModel>

          /** Updating Identities */
          update(
            userId: ZendeskID,
            identityId: ZendeskID,
            identity: UpdatePayload,
            cb: ZendeskCallback<unknown, unknown>
          ): ResponsePayload
          update(
            userId: ZendeskID,
            identityId: ZendeskID,
            identity: UpdatePayload
          ): Promise<ResponsePayload>
          makePrimary(userId: ZendeskID, identityId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ListPayload
          makePrimary(userId: ZendeskID, identityId: ZendeskID): Promise<ListPayload>
          verify(userId: ZendeskID, identityId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): ResponsePayload
          verify(userId: ZendeskID, identityId: ZendeskID): Promise<ResponsePayload>
          requestVerification(
            userId: ZendeskID,
            identityId: ZendeskID,
            cb: ZendeskCallback<unknown, unknown>
          ): unknown
          requestVerification(
            userId: ZendeskID,
            identityId: ZendeskID
          ): Promise<unknown>

          /** Deleting Identities */
          delete(userId: ZendeskID, identityId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): unknown
          delete(userId: ZendeskID, identityId: ZendeskID): Promise<unknown>
        }

        interface CreateModel {
          readonly type: IdentityType
          readonly value: string
          readonly verified?: boolean
          readonly primary?: boolean
        }

        interface UpdateModel {
          readonly value?: string
          readonly verified?: boolean
        }

        interface ResponseModel extends AuditableModel {
          readonly url: string
          readonly user_id: ZendeskID
          readonly type: IdentityType
          readonly value: string
          readonly verified: boolean
          readonly primary: boolean
          readonly undeliverable_count: number
          readonly deliverable_state: DeliverableState
        }

        interface CreatePayload {
          readonly identity: CreateModel
        }

        interface UpdatePayload {
          readonly identity: UpdateModel
        }

        interface ListPayload extends PaginablePayload {
          readonly identities: readonly ResponseModel[]
        }

        interface ResponsePayload {
          readonly identity: ResponseModel
        }

          type IdentityType = 'agent_forwarding' | 'email' | 'facebook' | 'google' | 'phone_number' | 'sdk'

          type DeliverableState = 'deliverable' | 'undeliverable'
      }

      namespace Fields {
        interface Methods {
          list(cb: ZendeskCallback<unknown, unknown>): unknown
          list(): Promise<unknown>
          show(fieldId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): unknown
          show(fieldId: ZendeskID): Promise<unknown>
          create(field: unknown, cb: ZendeskCallback<unknown, unknown>): unknown
          create(field: unknown): Promise<unknown>
          update(fieldId: ZendeskID, field: unknown, cb: ZendeskCallback<unknown, unknown>): unknown
          update(fieldId: ZendeskID, field: unknown): Promise<unknown>
          delete(fieldId: ZendeskID, cb: ZendeskCallback<unknown, unknown>): unknown
          delete(fieldId: ZendeskID): Promise<unknown>
        }
      }
  }

  export interface PaginablePayload {
    readonly next_page: number | null
    readonly previous_page: number | null
    readonly count: number
  }

  export interface PersistableModel {
    readonly id: ZendeskID
  }

  export interface TemporalModel extends PersistableModel {
    readonly created_at: string
  }

  export interface AuditableModel extends TemporalModel {
    readonly updated_at: string | null
  }

  export type ZendeskID = number
}
