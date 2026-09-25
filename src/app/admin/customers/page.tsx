import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { listCustomers } from "@/server/admin/customers";
import { oneOf, pageParam, param, type SearchParams } from "@/server/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { AdminPageHeader, CardItem, CardList, DataTable, FilterBar, FilterSelect, Meta, td, th } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";

export const metadata: Metadata = { title: "Customers" };

const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;

function RoleBadge({ role, isActive }: { role: (typeof ROLES)[number]; isActive: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      {role !== "CUSTOMER" && <Badge tone="dark">{role === "ADMIN" ? "Admin" : "Staff"}</Badge>}
      {!isActive && <Badge tone="danger">Deactivated</Badge>}
    </span>
  );
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = { q: param(sp, "q"), role: oneOf(param(sp, "role"), ROLES), page: pageParam(sp) };
  const { rows, info } = await listCustomers(filters);

  return (
    <>
      <AdminPageHeader eyebrow="People" title="Customers" description="Registered accounts, their orders and lifetime value." />

      <FilterBar action="/admin/customers" query={filters.q} queryPlaceholder="Name, email or phone" resetHref="/admin/customers">
        <FilterSelect
          name="role"
          label="Role"
          value={filters.role}
          options={[
            { value: "CUSTOMER", label: "Customers" },
            { value: "STAFF", label: "Staff" },
            { value: "ADMIN", label: "Admins" },
          ]}
          allLabel="All accounts"
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState icon={<Users />} title="No accounts found" description="Try another search." />
      ) : (
        <>
          <DataTable caption="Customers">
            <thead className="border-b border-border bg-subtle/60">
              <tr>
                <th scope="col" className={th}>Name</th>
                <th scope="col" className={th}>Contact</th>
                <th scope="col" className={th}>Joined</th>
                <th scope="col" className={`${th} text-right`}>Orders</th>
                <th scope="col" className={`${th} text-right`}>Lifetime value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-subtle/40">
                  <td className={td}>
                    <Link href={`/admin/customers/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                    <RoleBadge role={u.role} isActive={u.isActive} />
                  </td>
                  <td className={td}>
                    <p className="max-w-64 truncate">{u.email}</p>
                    {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
                  </td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(u.createdAt)}</td>
                  <td className={`${td} num text-right`}>{u._count.orders}</td>
                  <td className={`${td} num text-right font-medium`}>{formatPrice(u.lifetimeValue)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          <CardList label="Customers">
            {rows.map((u) => (
              <CardItem key={u.id}>
                <Link href={`/admin/customers/${u.id}`} className="block truncate font-medium hover:underline">
                  {u.name}
                </Link>
                <p className="truncate text-xs text-muted">{u.email}</p>
                <div className="mt-1">
                  <RoleBadge role={u.role} isActive={u.isActive} />
                </div>
                <dl className="num mt-3 flex flex-col gap-1">
                  <Meta label="Orders">{u._count.orders}</Meta>
                  <Meta label="Lifetime value">{formatPrice(u.lifetimeValue)}</Meta>
                  <Meta label="Joined">{formatDate(u.createdAt)}</Meta>
                </dl>
              </CardItem>
            ))}
          </CardList>

          <AdminPagination info={info} basePath="/admin/customers" searchParams={sp} noun="accounts" />
        </>
      )}
    </>
  );
}
