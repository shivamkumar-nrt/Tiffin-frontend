import { Prisma } from '@prisma/client';
import type { TiffinType } from '../enums';
import { z } from 'zod';
import { prisma } from '../db';
import { notFound } from '../http';
import { comboDto, menuDto, menuItemDto, priceDto } from '../mappers';
import { parseDate, today } from '../time';
import { dec } from '../serialize';
import { comboSchema, menuItemSchema, menuSchema, priceSchema } from '../schemas';
import { logAction } from './audit';

type Db = Prisma.TransactionClient | typeof prisma;

// ---------------------------------------------------------------- prices

const defaultPrice = (type: TiffinType) =>
  Number(
    type === 'FULL'
      ? process.env.DEFAULT_FULL_PRICE ?? 120
      : process.env.DEFAULT_HALF_PRICE ?? 80,
  );

async function findCurrentPrice(type: TiffinType, date: Date, db: Db = prisma) {
  return db.priceConfig.findFirst({
    where: {
      tiffinType: type,
      isActive: true,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
    },
    orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
  });
}

export async function getPriceForTypeAndDate(type: TiffinType, date: Date, db: Db = prisma): Promise<Prisma.Decimal> {
  const found = await findCurrentPrice(type, date, db);
  return found ? found.price : dec(defaultPrice(type));
}

export async function getCurrentPrices() {
  const now = today();
  const build = async (type: TiffinType) => {
    const p = await findCurrentPrice(type, now);
    return priceDto(
      p ?? { tiffinType: type, price: defaultPrice(type), effectiveFrom: now, effectiveTo: null, isActive: true },
    );
  };
  const [FULL, HALF] = await Promise.all([build('FULL'), build('HALF')]);
  return { FULL, HALF };
}

export async function getAllPrices() {
  const rows = await prisma.priceConfig.findMany({ orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }] });
  return rows.map(priceDto);
}

export async function createPrice(dto: z.infer<typeof priceSchema>, adminEmail: string) {
  const saved = await prisma.priceConfig.create({
    data: {
      tiffinType: dto.tiffinType,
      price: dec(dto.price),
      effectiveFrom: parseDate(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? parseDate(dto.effectiveTo) : null,
      isActive: dto.active,
    },
  });
  await logAction(
    'CREATE_PRICE',
    'PriceConfig',
    saved.id,
    adminEmail,
    `Set ${saved.tiffinType} price to Rs. ${saved.price.toFixed(2)} effective from ${dto.effectiveFrom}`,
  );
  return priceDto(saved);
}

export async function updatePrice(id: number, dto: z.infer<typeof priceSchema>, adminEmail: string) {
  const existing = await prisma.priceConfig.findUnique({ where: { id } });
  if (!existing) throw notFound(`Price config not found with id: ${id}`);
  const updated = await prisma.priceConfig.update({
    where: { id },
    data: {
      price: dec(dto.price),
      effectiveFrom: parseDate(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? parseDate(dto.effectiveTo) : null,
      isActive: dto.active,
    },
  });
  await logAction('UPDATE_PRICE', 'PriceConfig', id, adminEmail, `Updated ${updated.tiffinType} price to Rs. ${updated.price.toFixed(2)}`);
  return priceDto(updated);
}

// ---------------------------------------------------------------- combos

export async function getAllCombos() {
  const rows = await prisma.comboPackage.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  return rows.map(comboDto);
}

export async function getActiveCombos() {
  const rows = await prisma.comboPackage.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
  return rows.map(comboDto);
}

export async function getComboById(id: number) {
  const c = await prisma.comboPackage.findUnique({ where: { id } });
  if (!c) throw notFound(`Combo package not found with id: ${id}`);
  return comboDto(c);
}

export async function createCombo(dto: z.infer<typeof comboSchema>, adminEmail: string) {
  const saved = await prisma.comboPackage.create({
    data: {
      name: dto.name.trim(),
      tiffinType: dto.tiffinType,
      price: dec(dto.price),
      description: dto.description ?? null,
      includedItems: JSON.stringify(dto.includedItems ?? []),
      isActive: dto.active,
    },
  });
  await logAction('CREATE_COMBO', 'ComboPackage', saved.id, adminEmail, `Created combo/thali package: ${saved.name} (Rs. ${saved.price.toFixed(2)})`);
  return comboDto(saved);
}

export async function updateCombo(id: number, dto: z.infer<typeof comboSchema>, adminEmail: string) {
  const existing = await prisma.comboPackage.findUnique({ where: { id } });
  if (!existing) throw notFound(`Combo package not found with id: ${id}`);
  const updated = await prisma.comboPackage.update({
    where: { id },
    data: {
      name: dto.name.trim(),
      tiffinType: dto.tiffinType,
      price: dec(dto.price),
      description: dto.description ?? null,
      includedItems: JSON.stringify(dto.includedItems ?? []),
      isActive: dto.active,
    },
  });
  await logAction('UPDATE_COMBO', 'ComboPackage', id, adminEmail, `Updated combo/thali package: ${updated.name} (Rs. ${updated.price.toFixed(2)})`);
  return comboDto(updated);
}

export async function deleteCombo(id: number, adminEmail: string) {
  const existing = await prisma.comboPackage.findUnique({ where: { id } });
  if (!existing) throw notFound(`Combo package not found with id: ${id}`);
  await prisma.comboPackage.delete({ where: { id } });
  await logAction('DELETE_COMBO', 'ComboPackage', id, adminEmail, `Deleted combo package: ${existing.name}`);
}

// ---------------------------------------------------------------- menus

export async function getMenuByDate(date: Date, db: Db = prisma) {
  const m = await db.menu.findUnique({ where: { serviceDate: date }, include: { items: true } });
  return m ? menuDto(m) : null;
}

export async function getMenusInRange(start: Date, end: Date) {
  const rows = await prisma.menu.findMany({
    where: { serviceDate: { gte: start, lte: end } },
    include: { items: true },
    orderBy: { serviceDate: 'asc' },
  });
  return rows.map(menuDto);
}

export async function createOrUpdateMenu(dto: z.infer<typeof menuSchema>, adminEmail: string) {
  const serviceDate = parseDate(dto.serviceDate);
  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.menu.findUnique({ where: { serviceDate } });
    const itemRows = (dto.items ?? []).map((i) => ({
      name: i.name,
      category: i.category,
      description: i.description ?? null,
      isSpicy: i.spicy,
      isSweet: i.sweet,
      isAvailable: true,
    }));
    if (existing) {
      await tx.menuItem.deleteMany({ where: { menuId: existing.id } });
      return tx.menu.update({
        where: { id: existing.id },
        data: {
          title: dto.title,
          description: dto.description ?? null,
          isSpecial: dto.special,
          items: { create: itemRows },
        },
        include: { items: true },
      });
    }
    return tx.menu.create({
      data: {
        serviceDate,
        title: dto.title,
        description: dto.description ?? null,
        isSpecial: dto.special,
        items: { create: itemRows },
      },
      include: { items: true },
    });
  });
  await logAction('SAVE_MENU', 'Menu', saved.id, adminEmail, `Configured menu for date: ${dto.serviceDate} ('${saved.title}')`);
  return menuDto(saved);
}

export async function deleteMenu(id: number, adminEmail: string) {
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) throw notFound(`Menu not found with id: ${id}`);
  await prisma.menu.delete({ where: { id } });
  await logAction('DELETE_MENU', 'Menu', id, adminEmail, `Deleted menu for date: ${menu.serviceDate.toISOString().slice(0, 10)}`);
}

export async function getAllMenuItems() {
  const rows = await prisma.menuItem.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] });
  return rows.map(menuItemDto);
}

export async function createMenuItem(dto: z.infer<typeof menuItemSchema>, adminEmail: string) {
  const saved = await prisma.menuItem.create({
    data: {
      name: dto.name.trim(),
      category: dto.category,
      description: dto.description ?? null,
      isSpicy: dto.spicy,
      isSweet: dto.sweet,
      isAvailable: true,
    },
  });
  await logAction('CREATE_MENU_ITEM', 'MenuItem', saved.id, adminEmail, `Added food dish/item: ${saved.name} (${saved.category})`);
  return menuItemDto(saved);
}

export async function deleteMenuItem(id: number, adminEmail: string) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw notFound(`Menu item not found with id: ${id}`);
  await prisma.menuItem.delete({ where: { id } });
  await logAction('DELETE_MENU_ITEM', 'MenuItem', id, adminEmail, `Deleted dish/item: ${item.name}`);
}
