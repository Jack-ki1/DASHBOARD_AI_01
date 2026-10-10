import { createFileRoute } from "@tanstack/react-router";
import { AppFooter, AppHeader } from "@/components/AppHeader";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  useTitle("Terms of Service — DASHBOARD AI");
  return (
    <div className="min-h-screen">
      <AppHeader />
      <article className="mx-auto max-w-2xl space-y-4 px-5 py-14 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p>
          By using DASHBOARD AI you agree to use it lawfully and only upload data you have the right
          to use.
        </p>
        <p>
          AI-generated dashboards and insights may contain mistakes. Review important figures before
          making decisions.
        </p>
        <p>
          You own the dashboards and data you create. You're responsible for what you choose to
          publish.
        </p>
        <p>
          We may update the service and these terms; continued use means you accept the changes.
        </p>
      </article>
      <AppFooter />
    </div>
  );
}
