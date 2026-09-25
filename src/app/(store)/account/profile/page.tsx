import { requireUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { AccountHeading } from "@/components/account/account-heading";
import { ProfileForm } from "@/components/account/profile-form";

export async function generateMetadata() {
  return pageMetadata({ title: "Profile", path: "/account/profile", noindex: true });
}

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <>
      <AccountHeading title="Profile" description="Your name and phone number are used for orders and delivery updates." />
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
      </div>
    </>
  );
}
