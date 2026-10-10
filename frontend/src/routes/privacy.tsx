import { createFileRoute } from "@tanstack/react-router";
import { AppFooter, AppHeader } from "@/components/AppHeader";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  useTitle("Privacy Policy — DASHBOARD AI");
  return (
    <div className="min-h-screen">
      <AppHeader />
      <article className="mx-auto max-w-2xl space-y-4 px-5 py-14 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p>
          We store your email address to run your account, and the dashboards and data you create so
          you can access them on any device.
        </p>
        <p>
          Data you upload is used only to build your dashboards. When you use AI features, your
          prompt and a small sample of column names and rows are sent to our AI provider to generate
          the result.
        </p>
        <p>
          Published dashboards are visible to anyone with the link. Unpublished dashboards are
          private to your account.
        </p>
        <p>
          You can delete any dashboard at any time from your workspace. To delete your account,
          contact us.
        </p>
      </article>
      <AppFooter />
    </div>
  );
}
