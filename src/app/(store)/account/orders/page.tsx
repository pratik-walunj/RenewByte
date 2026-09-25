import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { AccountHeading } from "@/components/account/account-heading";
import { OrderList, orderListSelect } from "@/components/account/order-list";

export async function generateMetadata() {
  return pageMetadata({ title: "My orders", path: "/account/orders", noindex: true });
}

const PER_PAGE = 10;

type SearchParams = Promise<{ page?: string | string[] }>;

export default async function AccountOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/account/orders");
  const { page: rawPage } = await searchParams;
  const requested = Math.max(1, Math.floor(Number(typeof rawPage === "string" ? rawPage : 1)) || 1);

  const total = await db.order.count({ where: { userId: user.id } });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(requested, pages);
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: orderListSelect,
  });

  return (
    <>
      <AccountHeading
        title="My orders"
        description={total ? `You've placed ${total} ${total === 1 ? "order" : "orders"} with us.` : undefined}
      />
      {orders.length ? (
        <>
          <OrderList orders={orders} />
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders?page=${page - 1}`} rel="prev">
                    <ChevronLeft aria-hidden /> Newer
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <p className="num text-[13px] text-muted">
                Page {page} of {pages}
              </p>
              {page < pages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders?page=${page + 1}`} rel="next">
                    Older <ChevronRight aria-hidden />
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description="Orders you place while signed in will appear here. Checked out as a guest? Use the order tracker."
        >
          <Button asChild>
            <Link href="/laptops">Browse laptops</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/track-order">Track a guest order</Link>
          </Button>
        </EmptyState>
      )}
    </>
  );
}
