"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="This page couldn't load"
      description={`Something went wrong on our side${error.digest ? ` (ref ${error.digest})` : ""}. Check the database connection and try again.`}
    >
      <Button onClick={reset}>Try again</Button>
    </EmptyState>
  );
}
