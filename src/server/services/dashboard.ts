import { prisma } from '../db';
import { notFound } from '../http';
import { num } from '../serialize';
import { today } from '../time';
import { balancesFor, userBalance } from './balance';
import { getCurrentPrices, getMenuByDate } from './catalog';
import { getMyInvoices } from './invoices';
import { searchPayments } from './payments';
import { getMyRecords, getMyRequests, getRequests } from './tiffin';

export async function getAdminDashboardStats() {
  const now = today();
  const first5 = { page: 0, size: 5, skip: 0, take: 5 };

  const [
    totalEmployees,
    activeEmployees,
    pendingRequests,
    totalTiffinsToday,
    revenue,
    todayRev,
    dues,
    prices,
    todayMenu,
    recentPending,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.tiffinRequest.count({ where: { status: 'PENDING' } }),
    prisma.tiffinRecord.count({ where: { serviceDate: now } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.tiffinRecord.aggregate({ where: { serviceDate: now }, _sum: { chargedAmount: true } }),
    prisma.tiffinRecord.aggregate({
      where: { status: 'UNPAID', user: { role: 'ROLE_EMPLOYEE' } },
      _sum: { chargedAmount: true },
    }),
    getCurrentPrices(),
    getMenuByDate(now),
    getRequests({ status: 'PENDING' }, first5),
    searchPayments({}, first5),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    pendingRequests,
    approvedRequestsToday: totalTiffinsToday,
    totalTiffinsToday,
    totalOutstandingDues: num(dues._sum.chargedAmount),
    totalRevenueCollected: num(revenue._sum.amount),
    todayRevenue: num(todayRev._sum.chargedAmount),
    currentFullPrice: prices.FULL,
    currentHalfPrice: prices.HALF,
    todayMenu,
    recentPendingRequests: recentPending.content,
    recentPayments: recentPayments.content,
  };
}

export async function getUserDashboardStats(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw notFound(`User not found with email: ${userEmail}`);

  const [balance, totalConsumed, myRequests, prices, todayMenu, recentRecords, invoices] = await Promise.all([
    userBalance(user.id),
    prisma.tiffinRecord.count({ where: { userId: user.id } }),
    getMyRequests(user.id),
    getCurrentPrices(),
    getMenuByDate(today()),
    getMyRecords(user.id, 'desc'),
    getMyInvoices(user.id),
  ]);

  return {
    outstandingBalance: balance,
    totalTiffinsConsumed: totalConsumed,
    pendingRequestsCount: myRequests.filter((r) => r.status === 'PENDING').length,
    todayMenu,
    currentFullPrice: prices.FULL,
    currentHalfPrice: prices.HALF,
    recentRequests: myRequests.slice(0, 5),
    recentRecords: recentRecords.slice(0, 5),
    recentInvoices: invoices.slice(0, 5),
  };
}

export { balancesFor };
