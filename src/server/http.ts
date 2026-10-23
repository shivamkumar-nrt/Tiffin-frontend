import { NextRequest, NextResponse } from 'next/server';
import { Prisma, RoleType, UserStatus } from '@prisma/client';
import { ZodError, ZodTypeAny, z } from 'zod';
import { jwtVerify } from 'jose';
import { prisma } from './db';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: unknown = null,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const notFound = (message: string) => new ApiError(404, message);

export const ok = <T>(data: T, message = 'Operation successful') =>
  NextResponse.json({ success: true, message, data: data ?? null });

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: RoleType;
  status: UserStatus;
}

export type Access = 'public' | 'user' | 'admin';

export interface Ctx<P> {
  req: NextRequest;
  params: P;
  query: URLSearchParams;
  /** Authenticated user (always set for 'user' / 'admin'; optional for 'public'). */
  user: AuthUser | null;
  /** Authenticated user, throws 401 if missing. */
  me: () => AuthUser;
}

function jwtKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(secret);
}

async function resolveUser(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), jwtKey(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const user = await prisma.user.findUnique({ where: { email: payload.sub } });
    if (!user || user.status !== 'ACTIVE') return null;
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, status: user.status };
  } catch {
    return null;
  }
}

function unauthorized(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Full authentication is required to access this resource',
      path: new URL(req.url).pathname,
    },
    { status: 401 },
  );
}

function handleError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ success: false, message: e.message, data: e.data }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of e.issues) {
      const field = issue.path.join('.') || 'body';
      if (!(field in errors)) errors[field] = issue.message;
    }
    return NextResponse.json(
      { success: false, message: 'Validation failed', data: errors },
      { status: 400 },
    );
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return NextResponse.json(
      { success: false, message: 'A record with the same unique value already exists', data: null },
      { status: 400 },
    );
  }
  console.error(e);
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json(
    { success: false, message: `An error occurred: ${msg}`, data: null },
    { status: 500 },
  );
}

/**
 * Wraps a route handler with auth, role checks and the legacy ApiResponse error envelope.
 * Replaces Spring Security's filter chain + @PreAuthorize + GlobalExceptionHandler.
 */
export function route<P = Record<string, never>>(
  access: Access,
  handler: (ctx: Ctx<P>) => Promise<Response>,
) {
  return async (req: NextRequest, context: { params: P }): Promise<Response> => {
    try {
      const user = await resolveUser(req);
      if (access !== 'public' && !user) return unauthorized(req);
      if (access === 'admin' && user!.role !== 'ROLE_ADMIN') {
        throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
      }
      return await handler({
        req,
        params: context?.params ?? ({} as P),
        query: new URL(req.url).searchParams,
        user,
        me: () => {
          if (!user) throw new ApiError(401, 'Unauthorized');
          return user;
        },
      });
    } catch (e) {
      return handleError(e);
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Malformed or missing JSON request body');
  }
  return schema.parse(raw);
}

/** Optional body (e.g. reject with no payload). Never throws on empty/invalid JSON. */
export async function parseOptionalBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function intParam(value: string, name = 'id'): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 2147483647) throw badRequest(`Invalid ${name}: ${value}`);
  return n;
}

export function optInt(query: URLSearchParams, name: string): number | undefined {
  const v = query.get(name);
  if (v === null || v === '') return undefined;
  return intParam(v, name);
}

export function optEnum<T extends string>(query: URLSearchParams, name: string, values: readonly T[]): T | undefined {
  const v = query.get(name);
  if (v === null || v === '') return undefined;
  if (!values.includes(v as T)) throw badRequest(`Invalid value for ${name}: ${v}`);
  return v as T;
}

export function optDate(query: URLSearchParams, name: string): Date | undefined {
  const v = query.get(name);
  if (v === null || v === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw badRequest(`Invalid date for ${name}: ${v}`);
  return new Date(`${v}T00:00:00.000Z`);
}

export function pageParams(query: URLSearchParams, defaultSize = 10) {
  const page = Math.max(0, Number(query.get('page') ?? 0) || 0);
  const size = Math.min(200, Math.max(1, Number(query.get('size') ?? defaultSize) || defaultSize));
  return { page, size, skip: page * size, take: size };
}

/** Same JSON shape as Spring Data's Page<T> (the fields the frontend reads, plus the common extras). */
export function pageOf<T>(content: T[], total: number, page: number, size: number) {
  const totalPages = Math.ceil(total / size);
  return {
    content,
    totalElements: total,
    totalPages,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
}
