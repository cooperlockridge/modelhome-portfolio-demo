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
  const communityCount = communities.filter(
    (c) => c.tenantId === tenantId,
  ).length;
  const tenantHomes = homes.filter((h) => h.tenantId === tenantId).length;
  const status = busy
    ? `${busy}…`
    : !ready && !error
      ? "Connecting…"
      : ready
        ? "Session active"
        : "Offline";
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <div className="demo-bar">
        <span>
          <strong>Demo environment</strong>
          <span className="demo-bar-detail">
            {" "}
            · Fictional builders, homes, and buyers · Simulated pricing
          </span>
        </span>
        <button onClick={() => setAbout(true)}>About this demo</button>
      </div>
      <div className="app">
        <aside className="sidebar">
          <a
            className="wordmark"
            href="/projects/modelhome"
            aria-label="ModelHome home"
          >
            <span className="brand-mark" aria-hidden="true">
              <Icon name="home" />
            </span>
            ModelHome
          </a>
          <label className="workspace-switch">
            <span>Workspace</span>
            <span className="workspace-select">
              <span
                className="workspace-avatar"
                style={{ background: builder.color }}
                aria-hidden="true"
              >
                {builder.name.charAt(0)}
              </span>
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
            </span>
          </label>
          <nav aria-label="Workspace navigation" className="side-nav">
            <button
              aria-current={view === "homes" ? "page" : undefined}
              onClick={() => setView("homes")}
            >
              <Icon name="grid" /> Homes
            </button>
            <button
              aria-current={view === "activity" ? "page" : undefined}
              disabled={!!busy || !ready}
              onClick={() => void showActivity()}
            >
              <Icon name="activity" /> Activity
              <span className="count">{referrals.length}</span>
            </button>
          </nav>
          <div className="sidebar-foot">
            <button
              className="side-link"
              disabled={!!busy}
              onClick={() => setResetOpen(true)}
            >
              <Icon name="reset" /> Reset demo
            </button>
            <a
              className="side-link"
              href="https://github.com/cooperlockridge/modelhome-portfolio-demo"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="code" /> Source code
            </a>
            <a className="side-link" href="/">
              <Icon name="back" /> Cooper’s portfolio
            </a>
          </div>
        </aside>
        <div className="main">
          <header className="topbar">
            <nav aria-label="Breadcrumb" className="breadcrumb">
              <span>{builder.name}</span>
              <span aria-hidden="true">/</span>
              <strong>{view === "homes" ? "Homes" : "Activity"}</strong>
            </nav>
            <span
              className={`session-status ${busy || !ready ? "pending" : ""}`}
              role="status"
            >
              <span className="status-dot" aria-hidden="true" />
              {status}
            </span>
          </header>
          <main className="content" id="workspace">
            {error && (
              <div ref={errorRef} className="feedback error" role="alert">
                <strong>That step didn’t complete.</strong>
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
                    Try again
                  </button>
                )}
              </div>
            )}
            {notice && (
              <div className="feedback success" role="status">
                <Icon name="check" />
                <span>{notice}</span>
              </div>
            )}
            {view === "homes" ? (
              <>
                <section
                  className="page-section"
                  aria-labelledby="collection-heading"
                >
                  <div className="page-header">
                    <div>
                      <h1 id="collection-heading">Homes</h1>
                      <p className="page-meta">
                        {tenantHomes} homes · {communityCount}{" "}
                        {communityCount === 1 ? "community" : "communities"}
                      </p>
                    </div>
                    <label className="inline-field">
                      <span>Community</span>
                      <select
                        aria-label="Community"
                        value={communityId}
                        onChange={(e) => setCommunityId(e.target.value)}
                      >
                        <option value="all">All communities</option>
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
                        <div className="home-art">
                          <HomeIllustration variant={h.variant} />
                          {homeId === h.id && (
                            <span className="selected-tag">
                              <Icon name="check" /> Selected
                            </span>
                          )}
                        </div>
                        <div className="home-card-body">
                          <div className="home-title">
                            <h3>{h.name}</h3>
                            <span
                              className={`badge ${h.status === "Move-in ready" ? "ok" : "neutral"}`}
                            >
                              {h.status}
                            </span>
                          </div>
                          <p className="home-address">
                            {h.address} ·{" "}
                            {communities.find((c) => c.id === h.communityId)?.name}
                          </p>
                          <div className="home-foot">
                            <span className="home-specs">
                              {h.beds} bd · {h.baths} ba ·{" "}
                              {h.sqft.toLocaleString()} sq ft
                            </span>
                            <strong>{money(h.price)}</strong>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {available.length === 0 && (
                    <p className="empty-state">
                      No homes in this community. Choose another one.
                    </p>
                  )}
                </section>
                <section
                  className="panel scenario"
                  ref={scenarioRef}
                  aria-labelledby="scenario-heading"
                >
                  <header className="panel-header">
                    <h2 id="scenario-heading">Pricing scenario</h2>
                    <span className="panel-note">
                      Illustrative pricing · not a loan offer
                    </span>
                  </header>
                  <div className="scenario-layout">
                    <div className="scenario-controls">
                      <div className="selected-home-summary">
                        <span className="mini-art">
                          <HomeIllustration variant={home.variant} />
                        </span>
                        <div>
                          <strong>{home.name}</strong>
                          <span>
                            {community.name} · {money(home.price)}
                          </span>
                        </div>
                      </div>
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
                        style={{
                          ["--fill" as string]: `${((down - 5) / 35) * 100}%`,
                        }}
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
                        Lock period
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
                      <p className="helper">30-year fixed term on every option.</p>
                      <button
                        className={`${quote ? "secondary-button" : "primary-button"} full-width`}
                        disabled={!!busy || !ready}
                        onClick={() => void price()}
                      >
                        {busy === "Comparing pricing"
                          ? "Comparing…"
                          : quote
                            ? "Refresh pricing"
                            : "Compare pricing"}
                      </button>
                    </div>
                    <div className="comparison-area">
                      {quote ? (
                        <>
                          <div className="comparison-top">
                            <span>
                              {money(
                                quote.loanAmount ??
                                  home.price * (1 - down / 100),
                              )}{" "}
                              loan · 30-year fixed · {quote.lockDays}-day lock
                            </span>
                          </div>
                          <div className="pricing-grid" role="group" aria-label="Pricing options">
                            {quote.options.map((o) => (
                              <button
                                key={o.id}
                                className={`pricing-card ${optionId === o.id ? "chosen" : ""}`}
                                aria-pressed={optionId === o.id}
                                disabled={!!busy || sent}
                                onClick={() => setOptionId(o.id)}
                              >
                                <span className="option-head">
                                  <span className="option-label">{o.label}</span>
                                  <span className="radio" aria-hidden="true" />
                                </span>
                                <span className="rate">
                                  {o.rate.toFixed(3)}%
                                </span>
                                <dl>
                                  <div>
                                    <dt>Monthly P&amp;I</dt>
                                    <dd>{money(o.monthlyPrincipalInterest)}</dd>
                                  </div>
                                  <div>
                                    <dt>Upfront cost</dt>
                                    <dd>{money(o.upfrontCost)}</dd>
                                  </div>
                                </dl>
                              </button>
                            ))}
                          </div>
                          <p className="pricing-footnote">
                            Simulated rates, not APR. Excludes property taxes,
                            insurance, mortgage insurance, HOA dues, and other
                            closing costs. Upfront costs are illustrative only.
                          </p>
                        </>
                      ) : (
                        <div className="comparison-empty">
                          <span className="empty-icon" aria-hidden="true">
                            <Icon name="chart" />
                          </span>
                          <h3>No pricing yet</h3>
                          <p>
                            Set a down payment and lock period, then compare
                            three simulated options.
                          </p>
                        </div>
                      )}
                      {mismatch && !quote && (
                        <p className="feedback warning">
                          Mismatch simulation is on. Compare pricing to request{" "}
                          {lock} days and see the mock provider return a
                          different period.
                        </p>
                      )}
                      {quote?.mismatch && (
                        <div className="feedback warning">
                          <strong>
                            Requested {quote.requestedLockDays} days. Provider
                            returned {quote.returnedLockDays} days.
                          </strong>
                          <span>
                            This pricing can’t be used for a referral. Test the
                            server check below, or turn off the mismatch
                            simulation and compare again.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <footer className="panel-footer">
                    <div>
                      <span className="tag">Test</span>
                      <span>
                        Simulate a provider lock-period mismatch to see the
                        server reject stale pricing.
                      </span>
                    </div>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={mismatch}
                        disabled={!!busy}
                        onChange={(e) => {
                          setMismatch(e.target.checked);
                          invalidate();
                        }}
                      />
                      <span>Simulate mismatch</span>
                    </label>
                  </footer>
                </section>
                <section
                  className="panel referral"
                  aria-labelledby="referral-heading"
                >
                  <header className="panel-header">
                    <h2 id="referral-heading">Buyer referral</h2>
                    <span className="panel-note">
                      Stays in this demo · nobody is contacted
                    </span>
                  </header>
                  <div className="referral-body">
                    <div className="referral-field">
                      <label className="field-label" htmlFor="buyer">
                        Buyer
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
                    </div>
                    <dl className="referral-summary">
                      <div>
                        <dt>Home</dt>
                        <dd>{home.name}</dd>
                      </div>
                      <div>
                        <dt>Option</dt>
                        <dd>
                          {selectedOption
                            ? `${selectedOption.label} · ${selectedOption.rate.toFixed(3)}%`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    {sent ? (
                      <div className="submitted">
                        <span>
                          <Icon name="check" /> Referral submitted
                        </span>
                        <button
                          className="secondary-button"
                          disabled={!!busy || !ready}
                          onClick={() => void showActivity()}
                        >
                          View activity
                        </button>
                      </div>
                    ) : (
                      <div className="referral-action">
                        <button
                          className={quote ? "primary-button" : "secondary-button"}
                          disabled={!quote || !!busy || !ready}
                          onClick={() => void submit()}
                        >
                          {quote?.mismatch
                            ? "Test server rejection"
                            : "Submit referral"}
                        </button>
                        {!quote && (
                          <p className="helper">Compare pricing first.</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section className="page-section">
                <div className="page-header">
                  <div>
                    <h1>Activity</h1>
                    <p className="page-meta">
                      Referrals for {builder.name} in this browser session
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setView("homes")}
                  >
                    Back to homes
                  </button>
                </div>
                {referrals.length === 0 ? (
                  <div className="panel activity-empty">
                    <span className="empty-icon" aria-hidden="true">
                      <Icon name="activity" />
                    </span>
                    <h3>No referrals yet</h3>
                    <p>
                      Compare pricing on a home and submit a referral. It will
                      show up here.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setView("homes")}
                    >
                      Browse homes
                    </button>
                  </div>
                ) : (
                  <div className="panel table-wrap">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th scope="col">Buyer</th>
                          <th scope="col">Home</th>
                          <th scope="col" className="num">
                            Rate
                          </th>
                          <th scope="col" className="num">
                            Lock
                          </th>
                          <th scope="col">Submitted</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((r) => {
                          const b = buyers.find((x) => x.id === r.buyerId);
                          return (
                            <tr key={r.id}>
                              <td>
                                <strong>{b?.name}</strong>
                                <span>{b?.email}</span>
                              </td>
                              <td>{homes.find((h) => h.id === r.homeId)?.name}</td>
                              <td className="num">{r.rate.toFixed(3)}%</td>
                              <td className="num">{r.lockDays} days</td>
                              <td>
                                {new Date(r.createdAt).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td>
                                <span className="badge ok">{r.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
            <footer className="mobile-footer">
              <button className="side-link" disabled={!!busy} onClick={() => setResetOpen(true)}>
                <Icon name="reset" /> Reset demo
              </button>
              <a
                className="side-link"
                href="https://github.com/cooperlockridge/modelhome-portfolio-demo"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="code" /> Source code
              </a>
              <a className="side-link" href="/">
                <Icon name="back" /> Cooper’s portfolio
              </a>
            </footer>
          </main>
        </div>
      </div>
      <dialog
        ref={aboutRef}
        onCancel={() => setAbout(false)}
        onClose={() => setAbout(false)}
        aria-labelledby="about-title"
      >
        <div className="dialog-top">
          <h2 id="about-title">About this demo</h2>
          <button
            className="close-button"
            aria-label="Close about this demo"
            onClick={() => setAbout(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>{disclosure}</p>
        <div className="about-grid">
          <section>
            <h3>What works</h3>
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
        <div className="dialog-actions">
          <button className="secondary-button" onClick={() => setAbout(false)}>
            Close
          </button>
          <a
            className="primary-button"
            href="https://github.com/cooperlockridge/modelhome-portfolio-demo"
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        </div>
      </dialog>
      <dialog
        ref={resetRef}
        className="reset-dialog"
        onCancel={() => setResetOpen(false)}
        onClose={() => setResetOpen(false)}
        aria-labelledby="reset-title"
      >
        <div className="dialog-top">
          <h2 id="reset-title">Reset the demo?</h2>
          <button
            className="close-button"
            aria-label="Cancel reset"
            disabled={!!busy}
            onClick={() => setResetOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>
          This clears fictional referrals for both builders and restores the
          original home and scenario. It only affects this browser’s demo
          session.
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            disabled={!!busy}
            onClick={() => setResetOpen(false)}
          >
            Cancel
          </button>
          <button
            className="danger-button"
            disabled={!!busy}
            onClick={() => void reset()}
          >
            Reset demo
          </button>
        </div>
      </dialog>
    </>
  );
}

const iconPaths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  reset: "M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10",
  code: "m8 6-6 6 6 6M16 6l6 6-6 6",
  back: "M15 18l-6-6 6-6",
  check: "M5 12.5 10 17 19 7",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  close: "M6 6l12 12M18 6 6 18",
};
function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}
