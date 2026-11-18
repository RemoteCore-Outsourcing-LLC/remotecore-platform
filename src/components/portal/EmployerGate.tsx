import { Empty } from "./Dash";

// Shown on hiring pages while the company is not approved yet.
export function NotApproved({ status }: { status: string }) {
  return (
    <div className="pwrap pwrap--narrow">
      <Empty title={status === "suspended" ? "Your company account is paused" : "This opens once your company is approved"} action={<a className="btn btn--main btn--sm" href="/portal">Back to dashboard</a>}>
        {status === "suspended" ? "Please contact RemoteCore to reopen it." : "We check every new company account before it opens. We will email you as soon as yours is approved."}
      </Empty>
    </div>
  );
}
