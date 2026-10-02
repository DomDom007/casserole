// Casserole: organise a meal rota for a friend after surgery or a new baby, with dietary notes and drop-off times.
import { useState } from "react";
import { waLink } from "./lib/share";
import { useStored } from "./lib/store";
import { useShared } from "./lib/useShared";
import { addDays, prettyDate, todayISO } from "./lib/time";
import { Section, ShareBox, Stat, Stats } from "./ui/kit";

const T = "casserole";
type Train = { for: string; reason: string; address: string; dropoff: string; people: number; diet: string; likes: string; avoid: string; organiser: string; phone: string; start: string; days: number; skip: number[]; claims: Record<string, { who: string; dish: string }> };
const SAMPLE: Train = { for: "Nour and baby Adam", reason: "New baby", address: "Residence Les Pins, Bloc B, Apt 12, El Menzah", dropoff: "Between 17:00 and 19:00. Leave it with the guard if nobody answers.", people: 3, diet: "No pork. Nour is breastfeeding, so no alcohol or raw fish.", likes: "Soups, couscous, anything they can freeze", avoid: "Very spicy food", organiser: "Salma", phone: "", start: addDays(todayISO(), 1), days: 14, skip: [0], claims: { [addDays(todayISO(), 1)]: { who: "Amel", dish: "Chorba and bread" }, [addDays(todayISO(), 3)]: { who: "Karim", dish: "Lasagne (freezable)" } } };

function Calendar({ t, onPick, picked }: { t: Train; onPick?: (d: string) => void; picked?: string }) {
  const dates = Array.from({ length: t.days }, (_, i) => addDays(t.start, i));
  return (
    <div className="cs-cal">{dates.map(d => { const off = t.skip.includes(new Date(d + "T12:00:00Z").getUTCDay()); const c = t.claims[d]; return (
      <button key={d} className={"cs-day" + (c ? " taken" : "") + (off ? " off" : "") + (picked === d ? " picked" : "")} disabled={!!c || off || !onPick} onClick={() => onPick?.(d)}>
        <span>{prettyDate(d)}</span>{off ? <em>No meal needed</em> : c ? <em>{c.who}: {c.dish}</em> : <em>Open</em>}
      </button>); })}</div>
  );
}

export default function Casserole() {
  const shared = useShared<Train>();
  const [t, setT] = useStored<Train>(T, "train", SAMPLE);
  const [pick, setPick] = useState("");
  const [me, setMe] = useState({ name: "", dish: "" });
  const css = <style>{`.cs-cal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.cs-day{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;padding:10px;border-radius:10px;border:2px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;font-size:14px}
  .cs-day span{font-weight:700}.cs-day em{font-style:normal;font-size:13px;color:var(--muted)}.cs-day.taken{background:color-mix(in srgb,var(--good) 14%,transparent);border-color:transparent;cursor:default}.cs-day.off{opacity:.45;cursor:default}.cs-day.picked{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}.cs-day:disabled{cursor:default}
  .cs-info dt{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.cs-info dd{margin:0 0 10px}`}</style>;
  const info = (x: Train) => <dl className="cs-info"><dt>For</dt><dd>{x.for}, {x.people} {x.people === 1 ? "person" : "people"}</dd><dt>Diet</dt><dd>{x.diet || "No restrictions"}</dd>{x.likes && <><dt>They love</dt><dd>{x.likes}</dd></>}{x.avoid && <><dt>Please avoid</dt><dd>{x.avoid}</dd></>}<dt>Drop off</dt><dd>{x.address}<br />{x.dropoff}</dd></dl>;

  if (shared.loading) return <p className="empty-note">Opening the meal rota…</p>;
  if (shared.data) {
    const x = shared.data;
    return (
      <div className="stack">{css}
        <section className="panel"><p className="eyebrow">Meal rota organised by {x.organiser}</p><h2 style={{ fontSize: 34, margin: "6px 0 12px" }}>Meals for {x.for}</h2>{info(x)}</section>
        <Section title="Pick a day"><Calendar t={x} onPick={setPick} picked={pick} /><p className="note" style={{ marginTop: 8 }}>Shows the rota as it was when this link was sent.</p></Section>
        {pick && <Section title={`Bring a meal on ${prettyDate(pick)}`}>
          <div className="row"><label className="field"><span>Your name</span><input id="cs-me" className="input" value={me.name} onChange={e => setMe({ ...me, name: e.target.value })} /></label><label className="field" style={{ flexGrow: 2 }}><span>What you will bring</span><input id="cs-dish" className="input" value={me.dish} onChange={e => setMe({ ...me, dish: e.target.value })} placeholder="Chicken soup and bread" /></label></div>
          <a className="btn primary" style={{ marginTop: 12 }} aria-disabled={!me.name.trim()} href={me.name.trim() ? waLink(`Hi ${x.organiser}, I'll bring a meal for ${x.for} on ${prettyDate(pick)}: ${me.dish || "a meal"}. ${me.name}`, x.phone) : undefined} target="_blank" rel="noreferrer">Tell {x.organiser} on WhatsApp</a>
        </Section>}
      </div>
    );
  }

  const set = (p: Partial<Train>) => setT({ ...t, ...p });
  const dates = Array.from({ length: t.days }, (_, i) => addDays(t.start, i)).filter(d => !t.skip.includes(new Date(d + "T12:00:00Z").getUTCDay()));
  const open = dates.filter(d => !t.claims[d]);
  return (
    <div className="stack">{css}
      <Section title={`Meals for ${t.for}`}><Stats><Stat value={dates.length} label="Meals needed" /><Stat value={dates.length - open.length} label="Covered" tone="good" /><Stat value={open.length} label="Still open" tone={open.length ? "warn" : "good"} /></Stats></Section>
      <div className="grid2">
        <Section title="Details">
          <div className="stack" style={{ gap: 10 }}>
            <div className="row"><label className="field"><span>Meals for</span><input id="cs-for" className="input" value={t.for} onChange={e => set({ for: e.target.value })} /></label><label className="field" style={{ flex: "0 0 90px" }}><span>People</span><input id="cs-pp" className="input num" value={t.people} onChange={e => set({ people: parseInt(e.target.value) || 1 })} /></label></div>
            <label className="field"><span>Dietary needs</span><input id="cs-diet" className="input" value={t.diet} onChange={e => set({ diet: e.target.value })} /></label>
            <div className="row"><label className="field"><span>They love</span><input id="cs-likes" className="input" value={t.likes} onChange={e => set({ likes: e.target.value })} /></label><label className="field"><span>Please avoid</span><input id="cs-avoid" className="input" value={t.avoid} onChange={e => set({ avoid: e.target.value })} /></label></div>
            <label className="field"><span>Address</span><input id="cs-addr" className="input" value={t.address} onChange={e => set({ address: e.target.value })} /></label>
            <label className="field"><span>Drop-off instructions</span><input id="cs-drop" className="input" value={t.dropoff} onChange={e => set({ dropoff: e.target.value })} /></label>
            <div className="row"><label className="field"><span>Starts</span><input id="cs-start" type="date" className="input" value={t.start} onChange={e => set({ start: e.target.value })} /></label><label className="field"><span>For how many days</span><input id="cs-days" className="input num" value={t.days} onChange={e => set({ days: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)) })} /></label></div>
            <div className="field"><span>No meal needed on</span><div className="row" style={{ gap: 6 }}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((l, i) => <label key={l} className="check note"><input type="checkbox" checked={t.skip.includes(i)} onChange={e => set({ skip: e.target.checked ? [...t.skip, i] : t.skip.filter(x => x !== i) })} />{l}</label>)}</div></div>
            <div className="row"><label className="field"><span>Organiser</span><input id="cs-org" className="input" value={t.organiser} onChange={e => set({ organiser: e.target.value })} /></label><label className="field"><span>Organiser WhatsApp</span><input id="cs-ph" className="input" value={t.phone} onChange={e => set({ phone: e.target.value })} /></label></div>
          </div>
        </Section>
        <div className="stack">
          <Section title="Invite helpers"><ShareBox slug={T} data={t} label="Copy sign-up link" message={`Meal rota for ${t.for}. Pick a day you can bring dinner:`} /></Section>
          <Section title="Record a volunteer">
            <p className="note" style={{ marginBottom: 8 }}>When someone messages you, tap their day in the calendar below and fill it in.</p>
            {pick ? <form className="row" onSubmit={e => { e.preventDefault(); if (!me.name.trim()) return; set({ claims: { ...t.claims, [pick]: { who: me.name.trim(), dish: me.dish } } }); setPick(""); setMe({ name: "", dish: "" }); }}>
              <span className="pill">{prettyDate(pick)}</span><input className="input" style={{ flex: 1 }} aria-label="Volunteer" placeholder="Name" value={me.name} onChange={e => setMe({ ...me, name: e.target.value })} /><input className="input" style={{ flex: 1 }} aria-label="Dish" placeholder="Dish" value={me.dish} onChange={e => setMe({ ...me, dish: e.target.value })} /><button className="btn small primary" type="submit">Save</button>
            </form> : <p className="note">No day selected.</p>}
          </Section>
        </div>
      </div>
      <Section title="Rota">
        <Calendar t={t} onPick={setPick} picked={pick} />
        <div className="row" style={{ marginTop: 12, gap: 6 }}>{Object.entries(t.claims).sort().map(([d, c]) => <span key={d} className="pill">{prettyDate(d)}: {c.who} <button className="btn ghost small" style={{ padding: "0 4px" }} aria-label="Remove" onClick={() => { const n = { ...t.claims }; delete n[d]; set({ claims: n }); }}>×</button></span>)}</div>
      </Section>
    </div>
  );
}
