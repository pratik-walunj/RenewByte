import "server-only";
import type { InboxStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, pageInfo } from "@/server/admin/pagination";

export async function inboxCounts() {
  const [contact, tradeIn, subscribers] = await Promise.all([
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.tradeInRequest.count({ where: { status: "NEW" } }),
    db.newsletterSubscriber.count(),
  ]);
  return { contact, tradeIn, subscribers };
}

export async function listContactMessages(status: InboxStatus | "", page: number) {
  const where = status ? { status } : {};
  const total = await db.contactMessage.count({ where });
  const info = pageInfo(total, page);
  const rows = await db.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });
  return { rows, info };
}

export async function listTradeIns(status: InboxStatus | "", page: number) {
  const where = status ? { status } : {};
  const total = await db.tradeInRequest.count({ where });
  const info = pageInfo(total, page);
  const rows = await db.tradeInRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (info.page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });
  return { rows, info };
}

export async function listSubscribers(page: number) {
  const total = await db.newsletterSubscriber.count();
  const info = pageInfo(total, page, 50);
  const rows = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    skip: (info.page - 1) * 50,
    take: 50,
  });
  return { rows, info };
}
