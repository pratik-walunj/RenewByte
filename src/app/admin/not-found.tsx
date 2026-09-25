import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function AdminNotFound() {
  return (
    <EmptyState icon={<SearchX />} title="Not found" description="It may have been deleted, or the link is wrong.">
      <Button asChild>
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </EmptyState>
  );
}
