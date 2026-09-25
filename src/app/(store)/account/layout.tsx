import { requireUser } from "@/lib/auth/session";
import { AccountSidebar, AccountTabs } from "@/components/account/account-nav";

/** Signed-in customer area: sidebar on desktop, scrollable tabs on smaller screens. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-page pb-16">
      <AccountTabs />
      <div className="grid gap-8 pt-6 sm:pt-8 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10 lg:pt-10">
        <AccountSidebar name={user.name} email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
