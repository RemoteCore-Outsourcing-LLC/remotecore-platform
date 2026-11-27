import type { Metadata } from "next";
import { Close, PageHero, Steps } from "@/components/site/Blocks";
import { supabaseServer } from "@/lib/supabase/server";
import { readFilters, searchJobs, categories, PER_PAGE, activeCount } from "@/lib/jobs/search";
import { JobSearch, ResultsHead, Pager } from "@/components/jobs/JobSearch";
import { PublicJobCard } from "@/components/jobs/PublicJob";

export const metadata: Metadata = { title: "Find Opportunities", description: "Join the RemoteCore talent network and explore remote roles that match your skills and experience." };

export default async function FindOpportunities({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = readFilters(await searchParams);
  // Without the database keys (a laptop build) the job board shows as empty instead of failing.
  const [res, cats] = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await (async () => { const sb = await supabaseServer(); return Promise.all([searchJobs(sb, f), categories(sb)]); })()
    : [{ jobs: [], total: 0, failed: false }, []] as [Awaited<ReturnType<typeof searchJobs>>, Awaited<ReturnType<typeof categories>>];
  const searching = !!f.q || activeCount(f) > 0;
  return (
    <>
      <PageHero page="find-opportunities">
        <a className="btn btn--main" href="/register/job-seeker">Join Our Talent Network</a>
        <a className="btn btn--line" href="#jobs">See Open Jobs</a>
      </PageHero>

      <section className="sec sec--pale" id="jobs" aria-labelledby="jobs-h">
        <div className="wrap jobboard">
          <div className="head"><h2 id="jobs-h">Open Remote Jobs</h2><p className="lede">Search by job title, skill or industry. Every role here is open now.</p></div>
          <JobSearch base="/find-opportunities" anchor="#jobs" f={f} cats={cats} />
          {res.jobs.length === 0 ? (
            <div className="pj-empty">
              <h3>{searching ? "No Jobs Match This Search" : "No Open Jobs Right Now"}</h3>
              <p>{searching ? "Try fewer words or remove a filter." : "New roles are added often. Create your profile now so you can apply the moment one opens."}</p>
              {searching ? <a href="/find-opportunities#jobs">Clear the search</a> : <a className="btn btn--main" href="/register/job-seeker">Create Your Profile</a>}
            </div>
          ) : (
            <>
              <ResultsHead total={res.total} f={f} />
              <div className="pjs">{res.jobs.map((j) => <PublicJobCard key={j.id} job={j} />)}</div>
              <Pager base="/find-opportunities" anchor="#jobs" f={f} total={res.total} per={PER_PAGE} />
            </>
          )}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in><h2>How It Works</h2></div>
          <Steps items={[
            { title: "Create Your Account", text: "Enter your name, email, password, and country of residence. Confirm your email address." },
            { title: "Complete Your Profile", text: "Add your professional summary, employment experience, skills, tools, languages, preferred roles, availability, and time zone. Upload your resume." },
            { title: "Explore and Apply", text: "Browse available positions and submit applications for roles that match your background." },
            { title: "Screening and Interviews", text: "Candidates may be contacted for role specific screening, assessments, and interviews. Selection is based on client needs and qualifications." },
          ]} />
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>Join Our Talent Network</h2>
            <p className="lede">Tell us about yourself and the kind of remote work you want.</p>
            <div className="notice" style={{ marginTop: 28 }}>
              <b>Important notice.</b> Joining the talent network does not guarantee placement or employment. Learning Hub courses and paid Career Services are optional and are not required to apply for jobs.
            </div>
            <p className="soft" style={{ marginTop: 18, fontSize: 15 }}>You choose whether your profile appears in our Talent Marketplace. Businesses never see your phone, email or resume without your permission.</p>
          </div>
          <div className="panel" id="join">
            <h2>Create Your Free Account</h2>
            <p className="form-help">One sign up for everything. Create your account, confirm your email, then add your resume, experience and a short voice introduction. You can apply for jobs and follow every application from your dashboard.</p>
            <div className="btns" style={{ marginTop: 22 }}>
              <a className="btn btn--main" href="/register/job-seeker">Join Our Talent Network</a>
            </div>
            <small className="soft" style={{ display: "block", marginTop: 14 }}>Already have an account? <a href="/login?as=applicant">Log in</a></small>
          </div>
        </div>
      </section>

      <Close title="Take the Next Step in Your Remote Career." text="Create a full account to upload your resume, apply for jobs and follow every application. Want to build your skills first? See our Career Services and Learning Hub.">
        <a className="btn btn--main" href="/register/job-seeker">Create Your Account</a>
        <a className="btn btn--line" href="/career-services">Career Services</a>
        <a className="btn btn--line" href="/learning-hub">Learning Hub</a>
      </Close>
    </>
  );
}
