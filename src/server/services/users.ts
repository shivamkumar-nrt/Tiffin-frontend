import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { Prisma, RoleType, UserStatus } from '@prisma/client';
import { prisma } from '../db';
import { ApiError, AuthUser, badRequest, notFound, pageOf } from '../http';
import { userDto } from '../mappers';
import { balancesFor, userBalance } from './balance';
import { logAction } from './audit';

const DUMMY_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BzE4p5Fw0m2GmB3k7Nn0vJ0E9mXi';

function jwtKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(secret);
}

export async function signToken(email: string): Promise<string> {
  const ttl = Number(process.env.JWT_EXPIRATION_MS || 86400000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ttl) / 1000))
    .sign(jwtKey());
}

export async function toDto(user: Parameters<typeof userDto>[0]) {
  return userDto(user, await userBalance(user.id));
}

export async function login(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !valid) {
    throw new ApiError(401, 'Invalid email or password. Please verify your credentials or Sign Up.');
  }
  if (user.status !== 'ACTIVE') {
    throw badRequest('Your account is currently inactive. Please contact the administrator.');
  }
  const [token, balance] = await Promise.all([signToken(user.email), userBalance(user.id)]);
  await logAction('LOGIN', 'User', user.id, user.email, 'User logged in successfully');
  return {
    token,
    type: 'Bearer',
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    outstandingBalance: balance,
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  department?: string | null;
  role?: RoleType | null;
}

/** `actor` is the signed-in admin creating the user; anonymous self-signups are always employees. */
export async function register(input: RegisterInput, actor: AuthUser | null) {
  const email = input.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw badRequest(`User with email '${email}' already exists`);
  }
  const role: RoleType = actor?.role === 'ROLE_ADMIN' && input.role ? input.role : 'ROLE_EMPLOYEE';
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(input.password, 10),
      fullName: input.fullName.trim(),
      phone: input.phone ?? null,
      department: input.department ?? null,
      role,
      status: 'ACTIVE',
    },
  });
  await logAction(
    'CREATE_USER',
    'User',
    user.id,
    actor?.email ?? user.email,
    `Registered new user ${user.fullName} (${user.role})`,
  );
  return toDto(user);
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw notFound(`User not found with email: ${email}`);
  return toDto(user);
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound(`User not found with id: ${id}`);
  return toDto(user);
}

export async function getAllEmployees() {
  const users = await prisma.user.findMany({ where: { role: 'ROLE_EMPLOYEE' }, orderBy: { id: 'asc' } });
  const balances = await balancesFor(users.map((u) => u.id));
  return users.map((u) => userDto(u, balances.get(u.id) ?? 0));
}

const SORTABLE = ['id', 'email', 'fullName', 'phone', 'department', 'role', 'status', 'createdAt'] as const;

export async function searchUsers(
  search: string | null,
  page: { page: number; size: number; skip: number; take: number },
  sortBy: string,
  direction: string,
) {
  const field = (SORTABLE as readonly string[]).includes(sortBy) ? sortBy : 'createdAt';
  const order: Prisma.SortOrder = direction.toLowerCase() === 'asc' ? 'asc' : 'desc';
  const q = search?.trim();
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ [field]: order }, { id: 'asc' }],
      skip: page.skip,
      take: page.take,
    }),
    prisma.user.count({ where }),
  ]);
  const balances = await balancesFor(rows.map((u) => u.id));
  return pageOf(
    rows.map((u) => userDto(u, balances.get(u.id) ?? 0)),
    total,
    page.page,
    page.size,
  );
}

export async function updateUserStatus(id: number, status: UserStatus, adminEmail: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound(`User not found with id: ${id}`);
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  await logAction(
    'UPDATE_USER_STATUS',
    'User',
    id,
    adminEmail,
    `Updated status for ${user.email} from ${user.status} to ${status}`,
  );
  return toDto(updated);
}

export async function resetUserPassword(id: number, newPassword: string, adminEmail: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound(`User not found with id: ${id}`);
  await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(newPassword, 10) } });
  await logAction('RESET_USER_PASSWORD', 'User', id, adminEmail, `Admin reset password for user ${user.email}`);
}
