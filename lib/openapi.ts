const exampleUser = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@example.com',
  email_confirmed_at: '2026-05-05T02:35:40.649Z',
  phone: '',
  confirmed_at: '2026-05-05T02:35:40.649Z',
  last_sign_in_at: '2026-05-05T04:44:04.786Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    email: 'demo@example.com',
    email_verified: true,
    phone_verified: false,
    sub: '11111111-1111-4111-8111-111111111111',
  },
  identities: [],
  created_at: '2026-05-05T02:35:28.923Z',
  updated_at: '2026-05-05T04:44:04.788Z',
  is_anonymous: false,
}

const exampleDiaryId = '22222222-2222-4222-8222-222222222222'
const exampleWeekId = '33333333-3333-4333-8333-333333333333'
const exampleDayId = '44444444-4444-4444-8444-444444444444'
const exampleItemId = '55555555-5555-4555-8555-555555555555'

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Sleep Diary API',
    version: '1.0.0',
    description:
      'Swagger docs for auth and diary endpoints. Use **POST /api/auth/login** first in this UI to set your Supabase auth cookies, then test the protected diary endpoints in the same browser session.',
  },
  servers: [{ url: '/' }],
  tags: [
    {
      name: 'Auth',
      description: 'Session-based authentication endpoints.',
    },
    {
      name: 'Diaries',
      description: 'Protected diary endpoints. Must be logged in first.',
    },
  ],
  paths: {
    '/api/auth/sign-up': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailPasswordRequest' },
              examples: {
                valid: {
                  value: {
                    email: 'demo@example.com',
                    password: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                examples: {
                  success: {
                    value: {
                      message: 'User created successfully',
                      user: exampleUser,
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/MessageError400' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in a user and set auth cookies',
        description:
          'Run this first from Swagger UI. On success, the browser should store auth cookies for later diary requests.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailPasswordRequest' },
              examples: {
                valid: {
                  value: {
                    email: 'demo@example.com',
                    password: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User logged in successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                examples: {
                  success: {
                    value: {
                      message: 'User logged in successfully',
                      user: exampleUser,
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/MessageError400' },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['Auth'],
        summary: 'Log out the current user',
        responses: {
          '200': {
            description: 'User logged out successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'User logged out successfully' },
              },
            },
          },
          '401': {
            description: 'User is not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'User is not authenticated' },
              },
            },
          },
        },
      },
    },
    '/api/diaries': {
      get: {
        tags: ['Diaries'],
        summary: 'List diaries for the signed-in user',
        responses: {
          '200': {
            description: 'Diary list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiaryListResponse' },
                examples: {
                  success: {
                    value: {
                      diaries: [
                        {
                          id: exampleDiaryId,
                          startDate: '2026-05-01',
                          endDate: '2026-05-14',
                          createdAt: '2026-05-05T04:48:00.000Z',
                          updatedAt: '2026-05-05T04:48:00.000Z',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
        },
      },
      post: {
        tags: ['Diaries'],
        summary: 'Create a 7-day diary',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDiaryRequest' },
              examples: {
                valid: {
                  value: {
                    startDate: '2026-05-01',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Diary created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiaryDetailResponse' },
                examples: {
                  success: {
                    value: {
                      diary: {
                        id: exampleDiaryId,
                        userId: exampleUser.id,
                        startDate: '2026-05-01',
                        endDate: '2026-05-07',
                        createdAt: '2026-05-05T04:48:00.000Z',
                        updatedAt: '2026-05-05T04:48:00.000Z',
                        weeks: [
                          {
                            id: exampleWeekId,
                            diaryId: exampleDiaryId,
                            startDate: '2026-05-01',
                            endDate: '2026-05-07',
                            createdAt: '2026-05-05T04:48:00.000Z',
                            updatedAt: '2026-05-05T04:48:00.000Z',
                          },
                        ],
                        days: [
                          {
                            id: exampleDayId,
                            diaryId: exampleDiaryId,
                            diaryWeekId: exampleWeekId,
                            userId: exampleUser.id,
                            date: '2026-05-01',
                            dayOfWeek: 'Friday',
                            dayKind: 'day_off',
                            notes: null,
                            createdAt: '2026-05-05T04:48:00.000Z',
                            updatedAt: '2026-05-05T04:48:00.000Z',
                          },
                        ],
                        timelineItems: [],
                        metrics: [],
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '415': { $ref: '#/components/responses/ApiError415' },
          '422': { $ref: '#/components/responses/ValidationError422' },
        },
      },
    },
    '/api/diaries/{diaryId}': {
      get: {
        tags: ['Diaries'],
        summary: 'Get a diary with weeks, days, items, and metrics',
        parameters: [{ $ref: '#/components/parameters/DiaryId' }],
        responses: {
          '200': {
            description: 'Diary detail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiaryDetailResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
        },
      },
    },
    '/api/diaries/{diaryId}/days/{dayId}': {
      patch: {
        tags: ['Diaries'],
        summary: 'Update one diary day',
        parameters: [
          { $ref: '#/components/parameters/DiaryId' },
          { $ref: '#/components/parameters/DayId' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDiaryDayRequest' },
              examples: {
                updateDayKind: {
                  value: { dayKind: 'work' },
                },
                updateNotes: {
                  value: { notes: 'Slept better than expected.' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Diary day updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DiaryDayResponse' },
                example: {
                  day: {
                    id: exampleDayId,
                    diaryId: exampleDiaryId,
                    diaryWeekId: exampleWeekId,
                    userId: exampleUser.id,
                    date: '2026-05-01',
                    dayOfWeek: 'Friday',
                    dayKind: 'work',
                    notes: 'Slept better than expected.',
                    createdAt: '2026-05-05T04:48:00.000Z',
                    updatedAt: '2026-05-05T05:05:00.000Z',
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
          '415': { $ref: '#/components/responses/ApiError415' },
          '422': { $ref: '#/components/responses/ValidationError422' },
        },
      },
    },
    '/api/diaries/{diaryId}/timeline-items': {
      get: {
        tags: ['Diaries'],
        summary: 'List timeline items for a diary',
        parameters: [{ $ref: '#/components/parameters/DiaryId' }],
        responses: {
          '200': {
            description: 'Timeline items',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TimelineItemListResponse' },
                example: {
                  timelineItems: [
                    {
                      id: exampleItemId,
                      diaryId: exampleDiaryId,
                      diaryWeekId: exampleWeekId,
                      diaryDayId: exampleDayId,
                      userId: exampleUser.id,
                      type: 'sleep',
                      timestamp: null,
                      startTime: '2026-05-01T22:45:00.000Z',
                      endTime: '2026-05-02T06:15:00.000Z',
                      label: 'Main sleep block',
                      metadata: {},
                      createdAt: '2026-05-05T05:10:00.000Z',
                      updatedAt: '2026-05-05T05:10:00.000Z',
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
        },
      },
      post: {
        tags: ['Diaries'],
        summary: 'Create a timeline item',
        parameters: [{ $ref: '#/components/parameters/DiaryId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTimelineItemRequest' },
              examples: {
                intervalItem: {
                  summary: 'Sleep interval',
                  value: {
                    diaryDayId: exampleDayId,
                    type: 'sleep',
                    startTime: '2026-05-01T22:45:00.000Z',
                    endTime: '2026-05-02T06:15:00.000Z',
                    label: 'Main sleep block',
                    metadata: {},
                  },
                },
                pointItem: {
                  summary: 'Caffeine event',
                  value: {
                    diaryDayId: exampleDayId,
                    type: 'caffeine',
                    timestamp: '2026-05-01T14:30:00.000Z',
                    label: 'Coffee',
                    metadata: {
                      amountMg: 120,
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Timeline item created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TimelineItemResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
          '415': { $ref: '#/components/responses/ApiError415' },
          '422': { $ref: '#/components/responses/ValidationError422' },
        },
      },
    },
    '/api/diaries/{diaryId}/timeline-items/{itemId}': {
      patch: {
        tags: ['Diaries'],
        summary: 'Update a timeline item',
        parameters: [
          { $ref: '#/components/parameters/DiaryId' },
          { $ref: '#/components/parameters/ItemId' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTimelineItemRequest' },
              examples: {
                intervalUpdate: {
                  value: {
                    startTime: '2026-05-01T23:00:00.000Z',
                    endTime: '2026-05-02T06:20:00.000Z',
                    label: 'Adjusted sleep block',
                  },
                },
                pointUpdate: {
                  value: {
                    timestamp: '2026-05-01T14:45:00.000Z',
                    label: 'Large coffee',
                    metadata: {
                      amountMg: 160,
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Timeline item updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TimelineItemResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
          '415': { $ref: '#/components/responses/ApiError415' },
          '422': { $ref: '#/components/responses/ValidationError422' },
        },
      },
      delete: {
        tags: ['Diaries'],
        summary: 'Delete a timeline item',
        parameters: [
          { $ref: '#/components/parameters/DiaryId' },
          { $ref: '#/components/parameters/ItemId' },
        ],
        responses: {
          '200': {
            description: 'Timeline item deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteResponse' },
                example: {
                  deleted: { id: exampleItemId },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
        },
      },
    },
    '/api/diaries/{diaryId}/metrics': {
      get: {
        tags: ['Diaries'],
        summary: 'Recalculate and return weekly metrics',
        parameters: [{ $ref: '#/components/parameters/DiaryId' }],
        responses: {
          '200': {
            description: 'Weekly metrics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MetricsResponse' },
                example: {
                  metrics: [
                    {
                      id: '66666666-6666-4666-8666-666666666666',
                      diaryId: exampleDiaryId,
                      diaryWeekId: exampleWeekId,
                      userId: exampleUser.id,
                      averageBedtime: '22:52:00',
                      averageWakeTime: '06:18:00',
                      averageTotalSleepTimeMinutes: '442.50',
                      averageSleepLatencyMinutes: '18.00',
                      averageWasoMinutes: '22.50',
                      averageSleepEfficiencyPercent: '88.10',
                      calculatedAt: '2026-05-05T05:20:00.000Z',
                      createdAt: '2026-05-05T05:20:00.000Z',
                      updatedAt: '2026-05-05T05:20:00.000Z',
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
        },
      },
      post: {
        tags: ['Diaries'],
        summary: 'Recalculate and return weekly metrics',
        parameters: [{ $ref: '#/components/parameters/DiaryId' }],
        responses: {
          '200': {
            description: 'Weekly metrics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MetricsResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError401' },
          '404': { $ref: '#/components/responses/ApiError404' },
        },
      },
    },
  },
  components: {
    parameters: {
      DiaryId: {
        name: 'diaryId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        example: exampleDiaryId,
      },
      DayId: {
        name: 'dayId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        example: exampleDayId,
      },
      ItemId: {
        name: 'itemId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        example: exampleItemId,
      },
    },
    responses: {
      AuthError401: {
        description: 'User is not authenticated',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
            example: { message: 'User is not authenticated' },
          },
        },
      },
      MessageError400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
            examples: {
              invalidJson: { value: { message: 'Invalid JSON body' } },
              authError: { value: { message: 'Auth error: Invalid login credentials' } },
            },
          },
        },
      },
      ApiError404: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Diary not found',
              details: null,
            },
          },
        },
      },
      ApiError415: {
        description: 'Unsupported media type',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Content-Type must be application/json',
              details: null,
            },
          },
        },
      },
      ValidationError422: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Validation failed',
              details: {
                formErrors: [],
                fieldErrors: {
                  startDate: ['Expected YYYY-MM-DD date'],
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      EmailPasswordRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          details: {},
        },
      },
      AuthUser: {
        type: 'object',
        required: ['id', 'aud', 'role', 'email'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          aud: { type: 'string' },
          role: { type: 'string' },
          email: { type: 'string', format: 'email', nullable: true },
          email_confirmed_at: { type: 'string', format: 'date-time', nullable: true },
          phone: { type: 'string', nullable: true },
          confirmed_at: { type: 'string', format: 'date-time', nullable: true },
          last_sign_in_at: { type: 'string', format: 'date-time', nullable: true },
          app_metadata: { type: 'object', additionalProperties: true },
          user_metadata: { type: 'object', additionalProperties: true },
          identities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          is_anonymous: { type: 'boolean' },
        },
      },
      AuthSuccessResponse: {
        type: 'object',
        required: ['message', 'user'],
        properties: {
          message: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      CreateDiaryRequest: {
        type: 'object',
        required: ['startDate'],
        properties: {
          startDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            example: '2026-05-01',
          },
        },
      },
      UpdateDiaryDayRequest: {
        type: 'object',
        properties: {
          dayKind: {
            type: 'string',
            enum: ['work', 'school', 'day_off'],
          },
          notes: {
            type: ['string', 'null'],
            maxLength: 4000,
          },
        },
        minProperties: 1,
      },
      TimelineItemType: {
        type: 'string',
        enum: [
          'sleep',
          'in_bed',
          'exercise',
          'caffeine',
          'alcohol',
          'medicine',
          'note',
        ],
      },
      CreateTimelineItemRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['diaryDayId', 'type', 'timestamp'],
            properties: {
              diaryDayId: { type: 'string', format: 'uuid' },
              type: { $ref: '#/components/schemas/TimelineItemType' },
              timestamp: { type: 'string', format: 'date-time' },
              label: { type: ['string', 'null'], maxLength: 255 },
              metadata: { type: 'object', additionalProperties: true },
            },
          },
          {
            type: 'object',
            required: ['diaryDayId', 'type', 'startTime', 'endTime'],
            properties: {
              diaryDayId: { type: 'string', format: 'uuid' },
              type: { $ref: '#/components/schemas/TimelineItemType' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              label: { type: ['string', 'null'], maxLength: 255 },
              metadata: { type: 'object', additionalProperties: true },
            },
          },
        ],
      },
      UpdateTimelineItemRequest: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          label: { type: ['string', 'null'], maxLength: 255 },
          metadata: { type: 'object', additionalProperties: true },
        },
        minProperties: 1,
      },
      DiarySummary: {
        type: 'object',
        required: ['id', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DiaryWeek: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          diaryId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DiaryDay: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          diaryId: { type: 'string', format: 'uuid' },
          diaryWeekId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          date: { type: 'string' },
          dayOfWeek: { type: 'string' },
          dayKind: { type: 'string', enum: ['work', 'school', 'day_off'] },
          notes: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TimelineItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          diaryId: { type: 'string', format: 'uuid' },
          diaryWeekId: { type: 'string', format: 'uuid' },
          diaryDayId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: { $ref: '#/components/schemas/TimelineItemType' },
          timestamp: { type: ['string', 'null'], format: 'date-time' },
          startTime: { type: ['string', 'null'], format: 'date-time' },
          endTime: { type: ['string', 'null'], format: 'date-time' },
          label: { type: ['string', 'null'] },
          metadata: { type: 'object', additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DiaryWeekMetric: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          diaryId: { type: 'string', format: 'uuid' },
          diaryWeekId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          averageBedtime: { type: ['string', 'null'] },
          averageWakeTime: { type: ['string', 'null'] },
          averageTotalSleepTimeMinutes: { type: ['string', 'null'] },
          averageSleepLatencyMinutes: { type: ['string', 'null'] },
          averageWasoMinutes: { type: ['string', 'null'] },
          averageSleepEfficiencyPercent: { type: ['string', 'null'] },
          calculatedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DiaryDetail: {
        allOf: [
          { $ref: '#/components/schemas/DiarySummary' },
          {
            type: 'object',
            properties: {
              userId: { type: 'string', format: 'uuid' },
              weeks: {
                type: 'array',
                items: { $ref: '#/components/schemas/DiaryWeek' },
              },
              days: {
                type: 'array',
                items: { $ref: '#/components/schemas/DiaryDay' },
              },
              timelineItems: {
                type: 'array',
                items: { $ref: '#/components/schemas/TimelineItem' },
              },
              metrics: {
                type: 'array',
                items: { $ref: '#/components/schemas/DiaryWeekMetric' },
              },
            },
          },
        ],
      },
      DiaryListResponse: {
        type: 'object',
        required: ['diaries'],
        properties: {
          diaries: {
            type: 'array',
            items: { $ref: '#/components/schemas/DiarySummary' },
          },
        },
      },
      DiaryDetailResponse: {
        type: 'object',
        required: ['diary'],
        properties: {
          diary: { $ref: '#/components/schemas/DiaryDetail' },
        },
      },
      DiaryDayResponse: {
        type: 'object',
        required: ['day'],
        properties: {
          day: { $ref: '#/components/schemas/DiaryDay' },
        },
      },
      TimelineItemResponse: {
        type: 'object',
        required: ['timelineItem'],
        properties: {
          timelineItem: { $ref: '#/components/schemas/TimelineItem' },
        },
      },
      TimelineItemListResponse: {
        type: 'object',
        required: ['timelineItems'],
        properties: {
          timelineItems: {
            type: 'array',
            items: { $ref: '#/components/schemas/TimelineItem' },
          },
        },
      },
      MetricsResponse: {
        type: 'object',
        required: ['metrics'],
        properties: {
          metrics: {
            type: 'array',
            items: { $ref: '#/components/schemas/DiaryWeekMetric' },
          },
        },
      },
      DeleteResponse: {
        type: 'object',
        required: ['deleted'],
        properties: {
          deleted: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
  },
} as const
