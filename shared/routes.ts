import { z } from 'zod';
import { insertVolunteerSchema, insertEventSchema, volunteers, events, attendances } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  volunteers: {
    list: {
      method: 'GET' as const,
      path: '/api/volunteers' as const,
      responses: {
        200: z.array(z.custom<typeof volunteers.$inferSelect>()),
      },
    },
    ranking: {
      method: 'GET' as const,
      path: '/api/volunteers/ranking' as const,
      responses: {
        200: z.array(z.object({
          volunteer: z.custom<typeof volunteers.$inferSelect>(),
          totalPoints: z.number()
        })),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/volunteers/:id' as const,
      responses: {
        200: z.custom<typeof volunteers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/volunteers' as const,
      input: insertVolunteerSchema,
      responses: {
        201: z.custom<typeof volunteers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/volunteers/:id' as const,
      input: insertVolunteerSchema.partial(),
      responses: {
        200: z.custom<typeof volunteers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/volunteers/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id' as const,
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/events/:id' as const,
      input: insertEventSchema.partial(),
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  attendances: {
    listByEvent: {
      method: 'GET' as const,
      path: '/api/events/:eventId/attendances' as const,
      responses: {
        200: z.array(z.custom<typeof attendances.$inferSelect>()),
      },
    },
    record: {
      method: 'POST' as const,
      path: '/api/attendances' as const,
      input: z.object({
        eventId: z.number(),
        records: z.array(z.object({
          volunteerId: z.number(),
          status: z.string(),
        })),
      }),
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
  statistics: {
    get: {
      method: 'GET' as const,
      path: '/api/statistics' as const,
      responses: {
        200: z.object({
          genderBreakdown: z.array(z.object({
            gender: z.string().nullable(),
            count: z.number()
          })),
          fieldStudyBreakdown: z.array(z.object({
            field: z.string().nullable(),
            count: z.number()
          })),
          totalVolunteers: z.number(),
          maleCount: z.number(),
          femaleCount: z.number()
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
