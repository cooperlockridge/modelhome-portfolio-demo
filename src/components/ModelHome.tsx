"use client";

import { useEffect, useRef, useState } from "react";
import {
  builders,
  communities,
  homes,
  buyers,
  type Quote,
  type Referral,
} from "@/domain/demo";
import { HomeIllustration } from "./HomeIllustration";

type Result = {
  ok: boolean;
  error?: string;
  quote?: Quote;
  referrals?: Referral[];
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const disclosure =
  "ModelHome is a smaller, independently rebuilt portfolio demo inspired by a production builder portal I helped develop. It showcases selected workflows using fictional data and simulated services. It is not the production application.";
async function request(body: Record<string, unknown>): Promise<Result> {
  const send = async () => {
    const response = await fetch("/projects/modelhome/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as Result;
    if (!response.ok || !result.ok)
      throw new Error(
        result.error || "Something went wrong. Please try again.",
      );
    return result;
  };
  // Serialize this demo's requests across tabs that support Web Locks.
  return navigator.locks
    ? navigator.locks.request("modelhome:session", send)
    : send();
}
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function ModelHome() {
  const [tenantId, setTenantId] = useState<string>(builders[0].id);
  const [homeId, setHomeId] = useState<string>(homes[0].id);
  const [view, setView] = useState<"homes" | "activity">("homes");
  const [communityId, setCommunityId] = useState("all");
  const [down, setDown] = useState(20);
  const [lock, setLock] = useState(30);
  const [mismatch, setMismatch] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [optionId, setOptionId] = useState("standard");
  const [buyerId, setBuyerId] = useState<string>(buyers[0].id);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [busy, setBusy] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [about, setAbout] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const scenarioRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const resetRef = useRef<HTMLDialogElement>(null);
  const home = homes.find((h) => h.id === homeId)!;
  const community = communities.find((c) => c.id === home.communityId)!;
  const builder = builders.find((b) => b.id === tenantId)!;
  const available = homes.filter(
    (h) =>
      h.tenantId === tenantId &&
      (communityId === "all" || h.communityId === communityId),
  );
  const selectedOption = quote?.options.find((o) => o.id === optionId);

  useEffect(() => {
    let active = true;
    request({ action: "start", tenantId: builders[0].id })
      .then((r) => {
        if (active) {
          setReferrals(r.referrals || []);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (error)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);
  useEffect(() => {
    if (about) aboutRef.current?.showModal();
    else aboutRef.current?.close();
  }, [about]);
  useEffect(() => {
    if (resetOpen) resetRef.current?.showModal();
    else resetRef.current?.close();
  }, [resetOpen]);
  function invalidate() {
    setQuote(null);
    setSent(false);
    setError("");
    setNotice("");
  }
  async function run(label: string, job: () => Promise<void>) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy("");
    }
  }
  async function showActivity() {
    await run("Loading activity", async () => {
      const r = await request({ action: "activity", tenantId });
      setReferrals(r.referrals || []);
      setView("activity");
    });
  }
  async function switchBuilder(next: string) {
    await run("Switching builder", async () => {
      const r = await request({ action: "activity", tenantId: next });
      setTenantId(next);
      setHomeId(homes.find((h) => h.tenantId === next)!.id);
      setCommunityId("all");
      setDown(20);
      setLock(30);
      setMismatch(false);
      setReferrals(r.referrals || []);
      invalidate();
      setNotice(
        "Builder changed. Your scenario has been reset for this collection.",
      );
    });
  }
  async function price() {
    await run("Comparing pricing", async () => {
      const r = await request({
        action: "price",
        tenantId,
        homeId,
        downPaymentPercent: down,
        lockDays: lock,
        simulateMismatch: mismatch,
      });
      setQuote(r.quote!);
      setOptionId("standard");
      setSent(false);
    });
  }
  async function submit() {
    if (!quote) return;
    await run("Submitting referral", async () => {
      const r = await request({
        action: "submit",
        tenantId,
        quoteToken: quote.token,
        buyerId,
        optionId,
      });
      setReferrals(r.referrals || []);
      setSent(true);
      setNotice(
        "Fictional referral submitted. It is now in your demo activity. No one was contacted.",
      );
    });
  }
  async function reset() {
    await run("Resetting demo", async () => {
      await request({ action: "reset", tenantId: builders[0].id });
      setTenantId(builders[0].id);
      setHomeId(homes[0].id);
      setCommunityId("all");
      setDown(20);
      setLock(30);
      setMismatch(false);
      setQuote(null);
      setReferrals([]);
      setBuyerId(buyers[0].id);
      setSent(false);
      setView("homes");
      setReady(true);
      setNotice(
        "Fresh start. All fictional referrals and scenarios have been cleared.",
      );
      setResetOpen(false);
    });
  }
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <div className="demo-bar">
        <span className="status-dot" />
        Portfolio demo · Reduced scope · Fictional data{" "}
        <a href="/">
          Cooper’s portfolio <Arrow />
        </a>
      </div>
      <header className="site-header shell">
        <a
          className="wordmark"
          href="/projects/modelhome"
          aria-label="ModelHome home"
        >
          <span className="brand-mark" aria-hidden="true">
            m<span>h</span>
          </span>
          ModelHome<span className="wordmark-dot">.</span>
        </a>
        <nav aria-label="Demo navigation">
          <button
            aria-current={view === "homes" ? "page" : undefined}
            onClick={() => setView("homes")}
          >
            Explore homes
          </button>
          <button
            aria-current={view === "activity" ? "page" : undefined}
            disabled={!!busy || !ready}
            onClick={() => void showActivity()}
          >
            Activity <span className="count">{referrals.length}</span>
          </button>
          <button onClick={() => setAbout(true)}>About this demo</button>
        </nav>
        <a
          className="code-link"
          href="https://github.com/cooperlockridge/modelhome-portfolio-demo"
          target="_blank"
          rel="noreferrer"
        >
          View code <Arrow />
        </a>
      </header>
      <main className="shell" id="workspace">
        <section className="intro">
          <div>
            <p className="eyebrow">
              <span /> A LITTLE PRODUCT. A COMPLETE JOURNEY.
            </p>
            <h1>
              A place to explore.
              <br />
              <span>A home to imagine.</span>
            </h1>
            <p className="intro-copy">
              Find a home, explore the numbers, and take the next step.
              <br className="desktop-break" /> A small builder workspace, made
              for a three-minute visit.
            </p>
          </div>
          <div className="intro-aside">
            <span className="demo-edition">MODELHOME / DEMO EDITION 01</span>
            <p>{disclosure}</p>
            <button className="text-button" onClick={() => setAbout(true)}>
              See what’s inside <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
        <div className="workspace-toolbar">
          <div className="builder-control">
            <span className="builder-icon" aria-hidden="true">
              ⌂
            </span>
            <label>
              YOUR FICTIONAL BUILDER
              <select
                aria-label="Builder organization"
                value={tenantId}
                onChange={(e) => void switchBuilder(e.target.value)}
                disabled={!!busy || !ready}
              >
                {builders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="toolbar-right">
            <span>Demo switching · no sign-in</span>
            <button
              className="quiet-button"
              disabled={!!busy}
              onClick={() => setResetOpen(true)}
            >
              <span aria-hidden="true">↺</span> Reset demo
            </button>
          </div>
        </div>
        {error && (
          <div ref={errorRef} className="feedback error" role="alert">
            <strong>We couldn’t complete that step.</strong>
            <span>{error}</span>
            {!ready && (
              <button
                onClick={() =>
                  void run("Connecting", async () => {
                    const r = await request({ action: "start", tenantId });
                    setReferrals(r.referrals || []);
                    setReady(true);
                  })
                }
              >
                Try connecting again
              </button>
            )}
          </div>
        )}
        {notice && (
          <div className="feedback success" role="status">
            {notice}
          </div>
        )}
        {busy && (
          <p className="loading-status" role="status">
            {busy}…
          </p>
        )}
        {!ready && !error && (
          <p className="loading-status" role="status">
            Preparing your private demo session…
          </p>
        )}
        {view === "homes" ? (
          <>
            <section
              className="collection"
              aria-labelledby="collection-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">01 / FIND YOUR STARTING POINT</p>
                  <h2 id="collection-heading">Good things start at home.</h2>
                </div>
                <label className="filter-label">
                  Community
                  <select
                    aria-label="Community"
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                  >
                    {<option value="all">All communities</option>}
                    {communities
                      .filter((c) => c.tenantId === tenantId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="home-grid">
                {available.map((h) => (
                  <button
                    className={`home-card ${homeId === h.id ? "selected" : ""}`}
                    key={h.id}
                    aria-pressed={homeId === h.id}
                    disabled={!!busy}
                    onClick={() => {
                      setHomeId(h.id);
                      invalidate();
                      scenarioRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    <div className={`home-art home-art-${h.variant}`}>
                      <HomeIllustration variant={h.variant} />
                      <span className="home-tag">
                        {homeId === h.id
                          ? "✓ Selected home"
                          : "Explore this home"}
                      </span>
                    </div>
                    <div className="home-card-body">
                      <span className="community-name">
                        {communities.find((c) => c.id === h.communityId)?.name}
                      </span>
                      <div className="home-title">
                        <h3>{h.name}</h3>
                        <span aria-hidden="true">↗</span>
                      </div>
                      <p className="home-specs">
                        {h.beds} beds <i /> {h.baths} baths <i />{" "}
                        {h.sqft.toLocaleString()} sq ft
                      </p>
                      <div className="home-price">
                        <strong>{money(h.price)}</strong>
                        <span>Fictional listing</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {available.length === 0 && (
                <p className="empty-state">
                  No homes in this collection yet. Choose another community.
                </p>
              )}
            </section>
            <section
              className="scenario"
              ref={scenarioRef}
              aria-labelledby="scenario-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">02 / EXPLORE THE POSSIBILITIES</p>
                  <h2 id="scenario-heading">
                    A little clarity on the numbers.
                  </h2>
                </div>
                <span className="small-note">
                  Illustrative demo pricing—not a loan offer.
                </span>
              </div>
              <div className="scenario-layout">
                <aside className="scenario-controls">
                  <div className="selected-home-summary">
                    <span className="mini-art">
                      <HomeIllustration variant={home.variant} />
                    </span>
                    <div>
                      <span className="community-name">{community.name}</span>
                      <h3>{home.name}</h3>
                      <strong>{money(home.price)}</strong>
                    </div>
                  </div>
                  <div className="control-body">
                    <label className="range-label" htmlFor="down-payment">
                      Down payment <strong>{down}%</strong>
                    </label>
                    <input
                      id="down-payment"
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={down}
                      disabled={!!busy}
                      onChange={(e) => {
                        setDown(Number(e.target.value));
                        invalidate();
                      }}
                    />
                    <div className="range-caption">
                      <span>{money((home.price * down) / 100)} down</span>
                      <span>{money(home.price * (1 - down / 100))} loan</span>
                    </div>
                    <label className="field-label" htmlFor="lock-period">
                      Requested lock period
                    </label>
                    <select
                      id="lock-period"
                      value={lock}
                      disabled={!!busy}
                      onChange={(e) => {
                        setLock(Number(e.target.value));
                        invalidate();
                      }}
                    >
                      <option value="30">30 days</option>
                      <option value="45">45 days</option>
                      <option value="60">60 days</option>
                    </select>
                    <p className="helper">
                      All options use a 30-year term. Adjust your scenario, then
                      compare.
                    </p>
                    <button
                      className="primary-button full-width"
                      disabled={!!busy || !ready}
                      onClick={() => void price()}
                    >
                      {busy === "Comparing pricing"
                        ? "Comparing…"
                        : quote
                          ? "Refresh comparison"
                          : "Compare pricing"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </aside>
                <div className="comparison-area">
                  {quote ? (
                    <>
                      <div className="comparison-top">
                        <span className="eyebrow">THREE WAYS TO EXPLORE</span>
                        <span>
                          {quote.loanAmount
                            ? money(quote.loanAmount)
                            : money(home.price * (1 - down / 100))}{" "}
                          loan · 30 years
                        </span>
                      </div>
                      <div className="pricing-grid">
                        {quote.options.map((o) => (
                          <button
                            key={o.id}
                            className={`pricing-card ${optionId === o.id ? "chosen" : ""}`}
                            aria-pressed={optionId === o.id}
                            disabled={!!busy || sent}
                            onClick={() => setOptionId(o.id)}
                          >
                            <span className="option-label">{o.label}</span>
                            <span className="rate">
                              {o.rate.toFixed(3)}
                              <small>%</small>
                            </span>
                            <span className="rate-caption">
                              illustrative interest rate
                            </span>
                            <div className="monthly">
                              <strong>
                                {money(o.monthlyPrincipalInterest)}
                              </strong>
                              <span>/ month</span>
                            </div>
                            <span className="pi-label">
                              Principal & interest only
                            </span>
                            <div className="upfront">
                              <span>Illustrative upfront cost</span>
                              <strong>{money(o.upfrontCost)}</strong>
                            </div>
                            <span className="option-selected">
                              {optionId === o.id
                                ? "● Selected option"
                                : "○ Choose option"}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="pricing-footnote">
                        Simulated rates, not APR. Excludes property taxes,
                        insurance, mortgage insurance, HOA dues, and other
                        closing costs. Upfront costs are an illustrative
                        comparison only.
                      </p>
                    </>
                  ) : (
                    <div className="comparison-empty">
                      <div className="comparison-glyph" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <p className="eyebrow">
                        A FEW NUMBERS. A CLEARER PICTURE.
                      </p>
                      <h3>Make room for possibilities.</h3>
                      <p>
                        Choose your down payment and lock period.
                        <br />
                        Compare three simulated options side by side.
                      </p>
                      <span className="empty-pill">
                        No personal information needed
                      </span>
                    </div>
                  )}
                  <div className="correctness">
                    <div>
                      <span className="test-icon" aria-hidden="true">
                        ✓
                      </span>
                      <div>
                        <h3>What if the pricing doesn’t match?</h3>
                        <p>
                          Try a provider discrepancy and see the safety check in
                          action.
                        </p>
                      </div>
                    </div>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={mismatch}
                        disabled={!!busy}
                        onChange={(e) => {
                          setMismatch(e.target.checked);
                          invalidate();
                        }}
                      />
                      <span>Simulate pricing mismatch</span>
                    </label>
                  </div>
                  {mismatch && !quote && (
                    <p className="feedback warning">
                      Mismatch simulation is on. Compare pricing to request{" "}
                      {lock} days and see the mock provider return a different
                      period.
                    </p>
                  )}
                  {quote?.mismatch && (
                    <div className="feedback warning">
                      <strong>
                        Requested {quote.requestedLockDays} days. Provider
                        returned {quote.returnedLockDays} days.
                      </strong>
                      <span>
                        This pricing cannot be used for a referral. Try the
                        server check below, or turn off “Simulate pricing
                        mismatch” and compare again to continue.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section
              className="referral-section"
              aria-labelledby="referral-heading"
            >
              <div>
                <p className="eyebrow">03 / TAKE THE NEXT STEP</p>
                <h2 id="referral-heading">From possibility to a next step.</h2>
                <p>
                  Submit a fictional buyer referral and watch it appear in
                  activity.
                  <br />
                  Nothing is sent to a person or outside service.
                </p>
              </div>
              <div className="referral-form">
                <label className="field-label" htmlFor="buyer">
                  Fictional buyer preset
                </label>
                <select
                  id="buyer"
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  disabled={!!busy || sent}
                >
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.email}
                    </option>
                  ))}
                </select>
                {selectedOption && (
                  <p className="helper">
                    {home.name} · {selectedOption.label} ·{" "}
                    {selectedOption.rate.toFixed(3)}%
                  </p>
                )}
                {sent ? (
                  <div className="submitted">
                    <span>✓ Fictional referral submitted</span>
                    <button
                      className="text-button"
                      disabled={!!busy || !ready}
                      onClick={() => void showActivity()}
                    >
                      View activity →
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="primary-button full-width"
                      disabled={!quote || !!busy || !ready}
                      onClick={() => void submit()}
                    >
                      {quote?.mismatch
                        ? "Test server rejection"
                        : "Submit fictional referral"}
                      <span aria-hidden="true">→</span>
                    </button>
                    {!quote && (
                      <p className="helper">
                        Compare pricing to enable your fictional referral.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="activity-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR DEMO / ACTIVITY</p>
                <h2>A little progress, all in one place.</h2>
                <p>
                  Fictional referrals for {builder.name} — visible only in this
                  browser session.
                </p>
              </div>
              <button className="quiet-button" onClick={() => setView("homes")}>
                ← Explore homes
              </button>
            </div>
            {referrals.length === 0 ? (
              <div className="activity-empty">
                <span className="large-icon" aria-hidden="true">
                  ↗
                </span>
                <h3>Your next step starts with a home.</h3>
                <p>
                  Compare pricing and submit a fictional referral.
                  <br />
                  You’ll find it here, with no real-world follow-up.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setView("homes")}
                >
                  Explore homes →
                </button>
              </div>
            ) : (
              <div className="activity-list">
                {referrals.map((r) => (
                  <article key={r.id} className="activity-card">
                    <span className="activity-check" aria-hidden="true">
                      ✓
                    </span>
                    <div>
                      <span className="community-name">FICTIONAL REFERRAL</span>
                      <h3>{buyers.find((b) => b.id === r.buyerId)?.name}</h3>
                      <p>
                        {homes.find((h) => h.id === r.homeId)?.name} ·{" "}
                        {r.rate.toFixed(3)}% illustrative rate · {r.lockDays}{" "}
                        days
                      </p>
                      <small>{new Date(r.createdAt).toLocaleString()}</small>
                    </div>
                    <span className="success-pill">{r.status}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        <footer>
          <span className="footer-brand">
            ModelHome
            <span> / Built with intention. Kept deliberately small.</span>
          </span>
          <button className="text-button" onClick={() => setAbout(true)}>
            About this demo <Arrow />
          </button>
          <a href="/">
            Back to portfolio <Arrow />
          </a>
        </footer>
      </main>
      <dialog
        ref={aboutRef}
        onCancel={() => setAbout(false)}
        onClose={() => setAbout(false)}
        aria-labelledby="about-title"
      >
        <div className="dialog-top">
          <span className="eyebrow">THE SMALLER PICTURE</span>
          <button
            className="close-button"
            aria-label="Close about this demo"
            onClick={() => setAbout(false)}
          >
            ×
          </button>
        </div>
        <h2 id="about-title">
          Small by design.
          <br />
          Complete where it counts.
        </h2>
        <p>{disclosure}</p>
        <div className="about-grid">
          <section>
            <h3>What works here</h3>
            <p>
              Switch builders, browse six fictional homes, adjust a scenario,
              compare three pricing options, submit preset referrals, inspect
              activity, and reset your session.
            </p>
          </section>
          <section>
            <h3>What’s simulated</h3>
            <p>
              Every property, buyer, price, and pricing-provider response is
              synthetic. A simple documented formula drives the numbers. The
              mismatch toggle demonstrates a real server validation check.
            </p>
          </section>
          <section>
            <h3>What’s left out</h3>
            <p>
              The production project involved broader workflows and
              integrations. This recreation omits authentication, live mortgage
              APIs, CRM, documents, e-signatures, billing, and operational
              reporting.
            </p>
          </section>
          <section>
            <h3>How your session works</h3>
            <p>
              Builder switching is a demo feature, not authentication. A signed,
              scoped browser cookie stores up to eight fictional referrals. No
              database, contact collection, or analytics. Shared browser tabs
              share a session; reset clears it.
            </p>
          </section>
        </div>
        <p className="about-note">
          Newly written code. Original interface and illustrations. Synthetic
          fixtures. Independently implemented to demonstrate product judgment
          and engineering correctness.
        </p>
        <a
          className="primary-button"
          href="https://github.com/cooperlockridge/modelhome-portfolio-demo"
          target="_blank"
          rel="noreferrer"
        >
          Explore the source <Arrow />
        </a>
      </dialog>
      <dialog
        ref={resetRef}
        className="reset-dialog"
        onCancel={() => setResetOpen(false)}
        onClose={() => setResetOpen(false)}
        aria-labelledby="reset-title"
      >
        <div className="dialog-top">
          <span className="eyebrow">A FRESH START</span>
          <button
            className="close-button"
            aria-label="Cancel reset"
            disabled={!!busy}
            onClick={() => setResetOpen(false)}
          >
            ×
          </button>
        </div>
        <h2 id="reset-title">Start the demo again?</h2>
        <p>
          This clears fictional referrals for both builders and restores the
          original home and scenario. It only affects this browser’s demo
          session.
        </p>
        <div className="dialog-actions">
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={() => setResetOpen(false)}
          >
            Keep exploring
          </button>
          <button
            className="primary-button"
            disabled={!!busy}
            onClick={() => void reset()}
          >
            Reset everything
          </button>
        </div>
      </dialog>
    </>
  );
}
