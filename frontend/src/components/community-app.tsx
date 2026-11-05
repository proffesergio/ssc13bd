"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowUpRight,
  ArrowRight,
  Bell,
  Search,
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarDays,
  Calculator,
  BadgeCheck,
  MapPin,
  ChevronRight,
  Plus,
  X,
  Menu,
  Stethoscope,
  Scale,
  Building2,
  ShieldCheck,
  BriefcaseBusiness,
  LifeBuoy,
  Clock3,
  Check,
  CheckCheck,
  LoaderCircle,
  LogIn,
  Mail,
  Send,
  SlidersHorizontal,
  Sparkles,
  Globe2,
  GraduationCap,
  ExternalLink,
  CircleHelp,
  Activity,
  Heart,
  Coffee,
  ImageIcon,
  Copy,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Member = {
  id: string;
  name: string;
  image?: string | null;
  district: string;
  profession: string;
  organization?: string | null;
  bio?: string | null;
  bloodGroup?: string | null;
  batchVerified: boolean;
};
type Sos = {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  targetProfession?: string;
  urgency: string;
  status: string;
  createdAt: string;
  author: { id: string; name: string; image?: string | null };
};
type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  district: string;
  startsAt: string;
  capacity?: number | null;
  category?: string;
  image?: string | null;
  attendeeCount: number;
  isAttending?: boolean;
};
type Overview = {
  mode: string;
  stats: {
    members: number;
    districts: number;
    professions: number;
    openSos: number;
    upcomingEvents: number;
  };
  members: Member[];
  sosPosts: Sos[];
  events: Event[];
};
type Me = {
  mode: string;
  user: null | {
    id: string;
    name: string;
    email: string;
    role: string;
    batchVerified: boolean;
    district?: string;
    profession?: string;
    organization?: string;
    bio?: string;
    bloodGroup?: string;
    directoryVisible?: boolean;
  };
  verification: null | { id: string; status: string; reviewNote?: string };
};
const nav: { href: string; label: string; icon: LucideIcon; tag?: string }[] = [
  { href: "/", label: "Community home", icon: LayoutDashboard },
  { href: "/directory", label: "Alumni SOS directory", icon: Users },
  { href: "/sos", label: "Helpdesk & SOS", icon: HeartHandshake, tag: "SOS" },
  { href: "/events", label: "Meetups & events", icon: CalendarDays },
  { href: "/expenses", label: "Split expenses", icon: Calculator },
];
const districts = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Bagerhat", "Bandarban", "Barguna", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chuadanga", "Cumilla", "Cox’s Bazar", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rangamati", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Tangail", "Thakurgaon", "Outside Bangladesh"];
const professions = [
  "Doctor",
  "Lawyer",
  "Police",
  "Army",
  "Government",
  "Corporate",
];
const categoryIcons: Record<string, LucideIcon> = {
  Doctor: Stethoscope,
  Lawyer: Scale,
  Police: ShieldCheck,
  Army: ShieldCheck,
  Government: Building2,
  Corporate: BriefcaseBusiness,
};
const categories = [
  "Blood",
  "Medical",
  "Legal",
  "Emergency",
  "Career",
  "Other",
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "We couldn’t complete that request. Please try again.",
    );
  return data;
}
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}
function time(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}
function Avatar({
  name,
  small = false,
  index = 0,
}: {
  name: string;
  small?: boolean;
  index?: number;
}) {
  return (
    <span
      aria-label={name}
      className={`avatar tone-${index % 5} ${small ? "small" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
function Pill({
  children,
  kind = "green",
}: {
  children: React.ReactNode;
  kind?: string;
}) {
  return <span className={`pill ${kind}`}>{children}</span>;
}
function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function SectionTitle({
  title,
  subtitle,
  link,
  href,
}: {
  title: string;
  subtitle?: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {link || "View all"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={23} />
      <span>Gathering your community…</span>
    </div>
  );
}
function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="form-error" role="alert">
      {message}
    </div>
  );
}
function Dialog({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-top">
        <div>
          <span className="eyebrow">SSC13BD COMMUNITY</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function CommunityApp({ route }: { route: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: () => api<Overview>("overview"),
  });
  const me = useQuery({
    queryKey: ["me", session?.user?.email],
    queryFn: () => api<Me>("me"),
  });
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{
        notifications: {
          id: string;
          title: string;
          body?: string;
          createdAt: string;
        }[];
      }>("notifications"),
    enabled: !!session,
    refetchInterval: 60000,
  });
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login"))
      setLoginOpen(true);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  const demo = overview.data?.mode === "demo";
  const requireMember = (action: () => void) => {
    if (!session) {
      setLoginOpen(true);
      return;
    }
    if (!me.data?.user?.batchVerified) {
      router.push("/verification");
      setToast("Complete batch verification to unlock community actions.");
      return;
    }
    action();
  };
  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <Link className="brand" href="/" aria-label="SSC13BD home">
          <span className="brand-mark">
            13
            <span />
          </span>
          <div>
            SSC13<span className="brand-bd">BD</span>
            <small>ONE BATCH. ONE BOND.</small>
          </div>
        </Link>
        <div className="community-label">
          YOUR COMMUNITY <span>EST. 2013</span>
        </div>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.tag && <span className="nav-tag">{item.tag}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-separator" />
        <div className="community-label">YOUR CORNER</div>
        <Link
          href="/verification"
          className={`nav-item ${route === "verification" ? "active" : ""}`}
        >
          <BadgeCheck size={19} />
          Batch verification
          <small className="new-dot" />
        </Link>
        {me.data?.user?.role &&
          ["ADMIN", "MODERATOR"].includes(me.data.user.role) && (
            <Link href="/admin" className="nav-item">
              <ShieldCheck size={19} />
              Moderation
            </Link>
          )}
        <div className="sidebar-bottom">
          <div className="batch-card">
            <span className="batch-card-icon">
              <GraduationCap size={23} />
            </span>
            <h3>2013 was just the beginning.</h3>
            <p>
              The people you grew up with.
              <br />
              The network you grow with.
            </p>
            <Link href="/directory">
              Find your people <ArrowUpRight size={15} />
            </Link>
            <span className="batch-card-orbit" />
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" /> Made for our batch. Made in
            Bangladesh.
          </div>
          <button
            className="sidebar-profile"
            onClick={() =>
              session ? router.push("/verification") : setLoginOpen(true)
            }
          >
            <Avatar name={session?.user?.name || "Batch Mate"} small />
            <span>
              <strong>{session?.user?.name || "Hey, batchmate!"}</strong>
              <small>
                {session
                  ? me.data?.user?.batchVerified
                    ? "Verified batch member"
                    : "Verification pending"
                  : "Your community is waiting"}
              </small>
            </span>
            {session ? <ChevronRight size={16} /> : <LogIn size={17} />}
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Our community <ChevronRight size={13} />{" "}
              <strong>
                {route === "home"
                  ? "Overview"
                  : route === "directory"
                    ? "Alumni directory"
                    : route === "sos"
                      ? "Helpdesk & SOS"
                      : route[0].toUpperCase() + route.slice(1)}
              </strong>
            </span>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/directory?q=${encodeURIComponent(search)}`);
            }}
          >
            <Search size={17} />
            <input
              aria-label="Search batchmates"
              placeholder="Search your batchmates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-actions">
            <span className="batch-chip">
              <span className="status-dot" />
              SSC BATCH 2013
            </span>
            <button
              className={`icon-button notification-button ${notificationsOpen ? "selected" : ""}`}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell size={19} />
              {!!notifications.data?.notifications.length && <i />}
            </button>
            <button
              className="topbar-avatar"
              aria-label={session ? "Your profile" : "Sign in"}
              onClick={() =>
                session ? router.push("/verification") : setLoginOpen(true)
              }
            >
              <Avatar name={session?.user?.name || "Batch Mate"} small />
            </button>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <h3>Your community updates</h3>
              {notifications.data?.notifications.length ? (
                notifications.data.notifications.map((n) => (
                  <div className="notification" key={n.id}>
                    <HeartHandshake size={18} />
                    <div>
                      <strong>{n.title}</strong>
                      <p>{n.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>
                  {session
                    ? "You’re all caught up. Requests matching your profession will appear here."
                    : "Sign in to receive SOS requests that match your profession."}
                </p>
              )}
            </div>
          )}
        </header>
        <main className="main-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <span className="status-dot" /> Community preview{" "}
                <span className="demo-detail">
                  · Sample members and events. No real emergencies.
                </span>
              </span>
              <button onClick={() => setLoginOpen(true)}>
                Join the batch <ArrowRight size={13} />
              </button>
            </div>
          )}
          {overview.isError && (
            <ErrorMessage message="The community couldn’t load. Check your connection and try again." />
          )}
          {route === "home" && (
            <Home
              data={overview.data}
              loading={overview.isPending}
              ask={() => requireMember(() => router.push("/sos?new=1"))}
              me={me.data}
            />
          )}
          {route === "directory" && (
            <Directory
              onContact={(member) =>
                requireMember(() =>
                  router.push(
                    `/sos?new=1&profession=${encodeURIComponent(member.profession)}&district=${encodeURIComponent(member.district)}`,
                  ),
                )
              }
            />
          )}
          {route === "sos" && (
            <SosBoard requireMember={requireMember} toast={setToast} />
          )}
          {route === "events" && (
            <Events
              requireMember={requireMember}
              toast={setToast}
              canCreate={
                !!me.data?.user &&
                ["ADMIN", "MODERATOR", "TRUSTED"].includes(me.data.user.role)
              }
            />
          )}
          {route === "expenses" && (
            <Expenses requireMember={requireMember} toast={setToast} />
          )}
          {route === "verification" && (
            <Verification
              me={me.data}
              signIn={() => setLoginOpen(true)}
              toast={setToast}
            />
          )}
          {route === "admin" && <Moderation me={me.data} toast={setToast} />}
          <footer className="main-footer">
            <span>
              © {new Date().getFullYear()} SSC13BD{" "}
              <span className="footer-divider">/</span> A bond beyond the
              classroom.
            </span>
            <span>
              Built on friendship. <Heart size={12} />
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.slice(0, 4).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={pathname === n.href ? "active" : ""}
          >
            <n.icon size={20} />
            <span>
              {n.href === "/"
                ? "Home"
                : n.href === "/directory"
                  ? "Directory"
                  : n.href === "/sos"
                    ? "SOS"
                    : "Meetups"}
            </span>
          </Link>
        ))}
      </nav>
      {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} />}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Home({
  data,
  loading,
  ask,
  me,
}: {
  data?: Overview;
  loading: boolean;
  ask: () => void;
  me?: Me;
}) {
  return (
    <>
      <Heading
        eyebrow="CONNECTED BY 2013. HERE FOR EACH OTHER."
        title={
          me?.user
            ? `Good to see you, ${me.user.name.split(" ")[0]}.`
            : "Welcome home, batchmate."
        }
        description="Different paths. The same roots. Your people are right here."
        action={
          <Link href="/verification" className="button light">
            <BadgeCheck size={16} />{" "}
            {me?.user?.batchVerified
              ? "You're batch verified"
              : "Get batch verified"}
            <ArrowUpRight size={15} />
          </Link>
        }
      />
      <section className="hero">
        <div className="hero-content">
          <div className="hero-kicker">
            <span /> BANGLADESH’S SSC BATCH OF 2013
          </div>
          <h2>
            Same batch.
            <br />
            Stronger <em>together.</em>
          </h2>
          <p>
            From shared classrooms to shared possibilities.
            <br />
            Find a familiar face. Lend a hand. Make a memory.
          </p>
          <div className="hero-actions">
            <Link href="/directory" className="button primary">
              Explore the directory <ArrowUpRight size={17} />
            </Link>
            <Link href="/events" className="hero-secondary">
              Let’s catch up <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-social">
            <div className="avatar-stack">
              {["Rahim Ahmed", "Sadia Islam", "Nabil Hasan", "Maliha Noor"].map(
                (n, i) => (
                  <Avatar key={n} name={n} small index={i} />
                ),
              )}
            </div>
            <span>
              <strong>One unforgettable batch.</strong>
              <br />A whole country of connections.
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-sun" />
          <div className="hero-grain" />
          <div className="hero-caption">
            A bond that feels like home.
            <span>23.8103° N &nbsp; 90.4125° E</span>
          </div>
          <div className="monument">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="hero-hill back" />
          <div className="hero-hill front" />
          <div className="hero-water" />
          <div className="hero-boat">
            <span />
            <i />
          </div>
          <div className="art-tag">
            <span className="status-dot" /> ROOTED IN BANGLADESH
          </div>
          <div className="art-stamp">
            20
            <br />
            <span>13</span>
          </div>
        </div>
      </section>
      <section className="stats-grid" aria-label="Community at a glance">
        {[
          {
            icon: Users,
            value: data?.stats.members,
            label: "Batchmates connected",
            note: "Our growing family",
          },
          {
            icon: MapPin,
            value: data?.stats.districts,
            label: "Districts represented",
            note: "Across Bangladesh",
          },
          {
            icon: HeartHandshake,
            value: data?.stats.openSos,
            label: "Open help requests",
            note: "A little help goes a long way",
          },
          {
            icon: CalendarDays,
            value: data?.stats.upcomingEvents,
            label: "Upcoming meetups",
            note: "New memories await",
          },
        ].map((s, i) => (
          <div className="stat" key={s.label}>
            <div className={`stat-icon stat-${i}`}>
              <s.icon size={20} />
            </div>
            <div>
              <strong>
                {s.value === undefined
                  ? "—"
                  : new Intl.NumberFormat("en").format(s.value)}
              </strong>
              <span>{s.label}</span>
              <small>{s.note}</small>
            </div>
          </div>
        ))}
      </section>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="sos-section">
            <SectionTitle
              title="A batchmate needs you"
              subtitle="A small effort. A real difference."
              href="/sos"
              link="Visit helpdesk"
            />
            {loading ? (
              <Loading />
            ) : data?.sosPosts.length ? (
              <div className="sos-list">
                {data.sosPosts.slice(0, 2).map((s, i) => (
                  <SosCard key={s.id} post={s} index={i} compact />
                ))}
              </div>
            ) : (
              <Empty
                title="All quiet for now"
                description="New requests from your batchmates will appear here."
              />
            )}
          </section>
          <section className="people-section">
            <SectionTitle
              title="Good people. Great connections."
              subtitle="The right batchmate might be one hello away."
              href="/directory"
              link="Explore directory"
            />
            <div className="people-preview">
              {data?.members
                .slice(0, 3)
                .map((m, i) => (
                  <MemberCard key={m.id} member={m} index={i} compact />
                ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="quick-card">
            <div className="quick-title">
              <span className="quick-icon">
                <Sparkles size={18} />
              </span>
              <h2>What brings you here?</h2>
            </div>
            <Link href="/directory?profession=Doctor">
              <span className="quick-action-icon">
                <Stethoscope size={20} />
              </span>
              <span>
                <strong>Find a doctor</strong>
                <small>Care from someone you know</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
            <button onClick={ask}>
              <span className="quick-action-icon peach">
                <HeartHandshake size={20} />
              </span>
              <span>
                <strong>Ask for a little help</strong>
                <small>Your batch has your back</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
            <Link href="/events">
              <span className="quick-action-icon purple">
                <Coffee size={20} />
              </span>
              <span>
                <strong>Meet your people</strong>
                <small>Take the conversation offline</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          </section>
          <section className="next-meetup">
            <SectionTitle
              title="Save the date"
              href="/events"
              link="All meetups"
            />
            {data?.events[0] ? (
              <EventCard event={data.events[0]} compact />
            ) : (
              <p className="muted">New meetups are on the way.</p>
            )}
          </section>
        </aside>
      </div>
      <section className="milestone-banner">
        <div className="milestone-icon">
          <GraduationCap size={30} />
        </div>
        <div>
          <span className="eyebrow">THEN, NOW, AND EVERYTHING AHEAD</span>
          <h2>We left school. We never left each other.</h2>
          <p>Every new connection makes this community a little stronger.</p>
        </div>
        <Link className="button light" href="/verification">
          Be part of the story <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}

function MemberCard({
  member: m,
  index = 0,
  compact = false,
  onContact,
}: {
  member: Member;
  index?: number;
  compact?: boolean;
  onContact?: (m: Member) => void;
}) {
  const Icon = categoryIcons[m.profession] || BriefcaseBusiness;
  return (
    <article className={`member-card ${compact ? "compact" : ""}`}>
      <div className="member-top">
        <Avatar name={m.name} index={index} />
        {m.batchVerified && (
          <span
            className="verified-icon"
            title="SSC batch verified; professional credentials are self-reported"
          >
            <BadgeCheck size={19} />
          </span>
        )}
      </div>
      <h3>{m.name}</h3>
      <span className="member-profession">
        <Icon size={13} />
        {m.profession}
      </span>
      <p className="member-org">{m.organization || "SSC batch of 2013"}</p>
      <div className="member-location">
        <MapPin size={13} />
        {m.district}
        {m.bloodGroup && <span className="blood-group">{m.bloodGroup}</span>}
      </div>
      {!compact && (
        <>
          <p className="member-bio">
            {m.bio || "Here to connect with batchmates and help where I can."}
          </p>
          <div className="member-bottom">
            <Pill>
              <BadgeCheck size={12} /> Batch verified
            </Pill>
            <button className="text-link" onClick={() => onContact?.(m)}>
              Connect <ArrowUpRight size={15} />
            </button>
          </div>
        </>
      )}
    </article>
  );
}
function Directory({ onContact }: { onContact: (m: Member) => void }) {
  const [search, setSearch] = useState("");
  const [profession, setProfession] = useState("");
  const [district, setDistrict] = useState("");
  const [map, setMap] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSearch(p.get("q") || "");
    setProfession(p.get("profession") || "");
  }, []);
  const query = useQuery({
    queryKey: ["directory", search, profession, district],
    queryFn: () =>
      api<{ mode: string; members: Member[] }>(
        `directory?${new URLSearchParams({ q: search, profession, district })}`,
      ),
  });
  return (
    <>
      <Heading
        eyebrow="YOUR BATCH. YOUR NETWORK."
        title="There’s always someone you know."
        description="Find a professional, reconnect with a friend, or be someone’s first call."
        action={
          <Link href="/verification" className="button primary">
            <Plus size={17} /> Join the directory
          </Link>
        }
      />
      <div className="directory-intro">
        <span>
          <ShieldCheck size={18} /> Batch-verified people. Familiar roots.
        </span>
        <p>
          Professional details are self-reported. A batch badge confirms SSC
          membership, not a professional license.
        </p>
      </div>
      <div className="profession-filters">
        <button
          className={!profession ? "selected" : ""}
          onClick={() => setProfession("")}
        >
          <Users size={17} />
          Everyone
        </button>
        {professions.slice(0, 6).map((p) => {
          const Icon = categoryIcons[p];
          return (
            <button
              key={p}
              className={profession === p ? "selected" : ""}
              onClick={() => setProfession(p)}
            >
              <Icon size={17} />
              {p === "Doctor" ? "Doctors" : p === "Lawyer" ? "Lawyers" : p}
            </button>
          );
        })}
      </div>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, workplace, or expertise"
            aria-label="Search directory"
          />
        </div>
        <label className="select-wrapper">
          <MapPin size={16} />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Filter by district"
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <button
          className={`button light ${map ? "selected" : ""}`}
          onClick={() => setMap(!map)}
        >
          <MapPin size={16} />
          {map ? "Show profiles" : "Location view"}
        </button>
      </div>
      <div className="results-meta">
        <span>
          {query.data?.members.length ?? "…"} batchmates{" "}
          {district ? `in ${district}` : "in your network"}
        </span>
        {(search || profession || district) && (
          <button
            className="text-link"
            onClick={() => {
              setSearch("");
              setDistrict("");
              setProfession("");
            }}
          >
            Clear filters <X size={13} />
          </button>
        )}
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorMessage message={query.error.message} />
      ) : !query.data.members.length ? (
        <Empty
          title="No familiar faces here yet"
          description="Try a different name, profession, or district."
        />
      ) : map ? (
        <LocationView members={query.data.members} />
      ) : (
        <div className="directory-grid">
          {query.data.members.map((m, i) => (
            <MemberCard member={m} index={i} key={m.id} onContact={onContact} />
          ))}
        </div>
      )}
      <div className="help-strip">
        <LifeBuoy size={20} />
        <div>
          <strong>Need help finding the right person?</strong>
          <p>
            Post a request and we’ll put it in front of batchmates in the right
            field.
          </p>
        </div>
        <Link className="text-link" href="/sos">
          Ask the community <ArrowUpRight size={16} />
        </Link>
      </div>
    </>
  );
}
function LocationView({ members }: { members: Member[] }) {
  const counts = members.reduce<Record<string, number>>(
    (a, m) => ({ ...a, [m.district]: (a[m.district] || 0) + 1 }),
    {},
  );
  const links: Record<string, string> = {
    Dhaka: "23.8103,90.4125",
    Chattogram: "22.3569,91.7832",
    Sylhet: "24.8949,91.8687",
    Rajshahi: "24.3745,88.6042",
    Khulna: "22.8456,89.5403",
  };
  return (
    <section className="location-view">
      <div className="map-art">
        <Globe2 size={140} strokeWidth={0.6} />
        <span>Our people. Across Bangladesh.</span>
        <p>District-level locations protect member privacy.</p>
      </div>
      <div className="district-list">
        {Object.entries(counts).map(([d, n]) => (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(links[d] || d + ", Bangladesh")}`}
            target="_blank"
            rel="noreferrer"
            key={d}
          >
            <MapPin size={18} />
            <strong>{d}</strong>
            <span>
              {n} {n === 1 ? "batchmate" : "batchmates"}
            </span>
            <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </section>
  );
}
function SosCard({
  post: s,
  index = 0,
  compact = false,
  onHelp,
}: {
  post: Sos;
  index?: number;
  compact?: boolean;
  onHelp?: () => void;
}) {
  return (
    <article className={`sos-card ${s.urgency === "urgent" ? "urgent" : ""}`}>
      <div className="sos-card-top">
        <div className="post-author">
          <Avatar name={s.author.name} small index={index} />
          <span>
            <strong>{s.author.name}</strong>
            <small>
              <MapPin size={11} />
              {s.district}
              <span>·</span>
              {date(s.createdAt)}
            </small>
          </span>
        </div>
        <Pill kind={s.urgency === "urgent" ? "red" : "amber"}>
          {s.urgency === "urgent" && <span className="pill-dot" />}
          {s.urgency === "urgent" ? "Urgent" : "Needs a hand"}
        </Pill>
      </div>
      <h3>{s.title}</h3>
      <p>{s.description}</p>
      <div className="sos-card-bottom">
        <span className="category-label">
          {s.category} <span>·</span>{" "}
          {s.status === "RESOLVED" ? "Resolved" : "Open request"}
        </span>
        {compact ? (
          <Link className="text-link" href="/sos">
            I can help <ArrowUpRight size={15} />
          </Link>
        ) : (
          <button className="text-link" onClick={onHelp}>
            {s.status === "RESOLVED" ? "View request" : "I can help"}
            <ArrowUpRight size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
function SosBoard({
  requireMember,
  toast,
}: {
  requireMember: (action: () => void) => void;
  toast: (s: string) => void;
}) {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [newPost, setNewPost] = useState(false);
  const [selected, setSelected] = useState<Sos | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new"))
      requireMember(() => setNewPost(true));
  }, []); // initial deep-link only
  const query = useQuery({
    queryKey: ["sos", category, status],
    queryFn: () =>
      api<{ sosPosts: Sos[] }>(
        `sos?${new URLSearchParams({ category, status })}`,
      ),
  });
  return (
    <>
      <Heading
        eyebrow="A COMMUNITY THAT SHOWS UP"
        title="Someone’s got your back."
        description="Ask for help. Share what you know. That’s what batchmates are for."
        action={
          <button
            className="button primary"
            onClick={() => requireMember(() => setNewPost(true))}
          >
            <Plus size={17} /> Ask for help
          </button>
        }
      />
      <div className="emergency-notice">
        <LifeBuoy size={20} />
        <div>
          <strong>In immediate danger? Call 999.</strong>
          <span>
            {" "}
            This is a community helpdesk. Responses aren’t monitored around the
            clock.
          </span>
        </div>
        <a href="tel:999">
          Call 999 <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="board-toolbar">
        <div className="profession-filters">
          <button
            className={!category ? "selected" : ""}
            onClick={() => setCategory("")}
          >
            All requests
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          aria-label="Request status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="OPEN">Open requests</option>
          <option value="RESOLVED">Resolved</option>
          <option value="">All statuses</option>
        </select>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorMessage message={query.error.message} />
      ) : query.data.sosPosts.length ? (
        <div className="board-grid">
          {query.data.sosPosts.map((s, i) => (
            <SosCard
              key={s.id}
              post={s}
              index={i}
              onHelp={() => setSelected(s)}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No requests in this category"
          description="Try another category or start a new request."
        />
      )}
      {newPost && (
        <RequestDialog onClose={() => setNewPost(false)} toast={toast} />
      )}{" "}
      {selected && (
        <SosDetails
          post={selected}
          onClose={() => setSelected(null)}
          requireMember={requireMember}
          toast={toast}
        />
      )}
    </>
  );
}
function SosDetails({
  post,
  onClose,
  requireMember,
  toast,
}: {
  post: Sos;
  onClose: () => void;
  requireMember: (a: () => void) => void;
  toast: (s: string) => void;
}) {
  const { data: session } = useSession();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["responses", post.id],
    queryFn: () =>
      api<{
        responses: {
          id: string;
          message: string;
          createdAt: string;
          author: { name: string };
        }[];
      }>(`sos/${post.id}/responses`),
    enabled: !!session,
  });
  const me = useQuery({
    queryKey: ["me", session?.user?.email],
    queryFn: () => api<Me>("me"),
  });
  async function respond() {
    setBusy(true);
    setError("");
    try {
      await api(`sos/${post.id}/responses`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setMessage("");
      await client.invalidateQueries({ queryKey: ["responses", post.id] });
      toast("Your offer of help has been shared with this batchmate.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resolve() {
    setBusy(true);
    try {
      await api(`sos/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      await client.invalidateQueries({ queryKey: ["sos"] });
      await client.invalidateQueries({ queryKey: ["overview"] });
      onClose();
      toast("Request marked as resolved. Thank you for closing the loop.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={post.title}
      subtitle={`${post.category} · ${post.district}`}
      onClose={onClose}
    >
      <p className="dialog-description">{post.description}</p>
      <h3 className="timeline-title">Batchmates showing up</h3>
      <div className="response-thread">
        {query.data?.responses.map((r) => (
          <div className="response" key={r.id}>
            <Avatar name={r.author.name} small />
            <div>
              <strong>{r.author.name}</strong>
              <p>{r.message}</p>
              <small>{date(r.createdAt)}</small>
            </div>
          </div>
        ))}
        {!query.data?.responses.length && (
          <p className="muted">
            {session
              ? "Be the first to offer a hand."
              : "Sign in to view the conversation and offer help."}
          </p>
        )}
      </div>
      {post.status !== "RESOLVED" && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            requireMember(() => void respond());
          }}
        >
          <label>
            Your offer of help
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share guidance, resources, or how you can help. Keep sensitive information private."
            />
          </label>
          {error && <ErrorMessage message={error} />}
          <button className="button primary full-width" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <HeartHandshake size={16} />
            )}
            Offer a hand
          </button>
        </form>
      )}
      {me.data?.user?.id === post.author.id && post.status !== "RESOLVED" && (
        <button
          disabled={busy}
          className="button light full-width resolve-button"
          onClick={() => void resolve()}
        >
          <Check size={16} />
          Mark as resolved
        </button>
      )}
    </Dialog>
  );
}
function RequestDialog({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: (s: string) => void;
}) {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title="A little help goes a long way."
      subtitle="Tell your batchmates what you need. Keep sensitive details out of your post."
      onClose={onClose}
    >
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            await api("sos", {
              method: "POST",
              body: JSON.stringify(Object.fromEntries(f)),
            });
            await client.invalidateQueries({ queryKey: ["sos"] });
            await client.invalidateQueries({ queryKey: ["overview"] });
            toast(
              "Your request is posted. Relevant batchmates will see a dashboard notification.",
            );
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          What do you need help with?
          <input
            name="title"
            required
            minLength={8}
            maxLength={140}
            placeholder="e.g. Looking for a cardiologist in Dhaka"
          />
        </label>
        <label>
          A little more detail
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={2000}
            rows={4}
            placeholder="Share enough detail for someone to help. Please don’t include private medical records or phone numbers."
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select name="category">
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            District
            <select
              name="district"
              defaultValue={
                typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get(
                      "district",
                    ) || "Dhaka"
                  : "Dhaka"
              }
            >
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Who could help?
            <select
              name="targetProfession"
              defaultValue={
                typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get(
                      "profession",
                    ) || "Doctor"
                  : "Doctor"
              }
            >
              {professions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Urgency
            <select name="urgency">
              <option value="normal">Regular request</option>
              <option value="urgent">Urgent help needed</option>
            </select>
          </label>
        </div>
        {error && <ErrorMessage message={error} />}
        <button disabled={busy} className="button primary full-width">
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Send size={16} />
          )}
          Post request
        </button>
      </form>
    </Dialog>
  );
}

function EventArt({ index = 0 }: { index?: number }) {
  return (
    <div className={`event-art event-art-${index % 3}`} aria-hidden="true">
      <span className="event-art-sun" />
      <div className="event-art-hill" />
      <div className="event-art-hill second" />
      <div className="event-art-lines" />
      <span className="event-art-word">
        {index % 3 === 0 ? "একসাথে" : index % 3 === 1 ? "আড্ডা" : "বন্ধুত্ব"}
      </span>
      <span className="event-art-caption">GOOD PEOPLE. GREAT MEMORIES.</span>
      <div className="event-art-leaf" />
      <div className="event-art-leaf second" />
    </div>
  );
}
function EventCard({
  event: e,
  compact = false,
  index = 0,
  onRsvp,
  onDetails,
}: {
  event: Event;
  compact?: boolean;
  index?: number;
  onRsvp?: (e: Event) => void;
  onDetails?: (e: Event) => void;
}) {
  return (
    <article className={`event-card ${compact ? "compact" : ""}`}>
      <div className="event-image">
        <EventArt index={index} />
        <div className="event-date">
          <strong>
            {new Date(e.startsAt).toLocaleDateString("en", {
              day: "2-digit",
              timeZone: "Asia/Dhaka",
            })}
          </strong>
          <span>
            {new Date(e.startsAt).toLocaleDateString("en", {
              month: "short",
              timeZone: "Asia/Dhaka",
            })}
          </span>
        </div>
        <span className="event-location-tag">
          <MapPin size={11} />
          {e.district}
        </span>
      </div>
      <div className="event-info">
        <span className="eyebrow">{e.category || "BATCH GET-TOGETHER"}</span>
        <h3>{e.title}</h3>
        <p>
          <MapPin size={13} />
          {e.location}
        </p>
        {!compact && (
          <p>
            <Clock3 size={13} />
            {date(e.startsAt)} · {time(e.startsAt)} (BST)
          </p>
        )}
        <div className="event-footer">
          <span className="attendees">
            <Users size={14} />
            <strong>{e.attendeeCount}</strong> going
            {e.capacity ? ` / ${e.capacity} spots` : ""}
          </span>
          {compact ? (
            <Link href="/events" className="text-link">
              Count me in <ArrowUpRight size={15} />
            </Link>
          ) : (
            <button
              className={`button ${e.isAttending ? "light" : "primary"} small-button`}
              onClick={() => onRsvp?.(e)}
            >
              {e.isAttending ? (
                <>
                  <Check size={14} />
                  Going
                </>
              ) : (
                <>
                  Count me in <Plus size={14} />
                </>
              )}
            </button>
          )}
        </div>
        {!compact && (
          <button className="event-detail-link" onClick={() => onDetails?.(e)}>
            Event details & memories <ArrowRight size={13} />
          </button>
        )}
      </div>
    </article>
  );
}
function Events({
  requireMember,
  toast,
  canCreate,
}: {
  requireMember: (a: () => void) => void;
  toast: (s: string) => void;
  canCreate: boolean;
}) {
  const client = useQueryClient();
  const [district, setDistrict] = useState("");
  const [create, setCreate] = useState(false);
  const [details, setDetails] = useState<Event | null>(null);
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["events", district],
    queryFn: () =>
      api<{ events: Event[] }>(`events?${new URLSearchParams({ district })}`),
    refetchInterval: 60000,
  });
  async function rsvp(event: Event) {
    if (busy) return;
    setBusy(true);
    try {
      await api(`events/${event.id}/rsvp`, {
        method: event.isAttending ? "DELETE" : "POST",
      });
      await client.invalidateQueries({ queryKey: ["events"] });
      toast(
        event.isAttending
          ? "Your RSVP has been cancelled."
          : "You’re on the list. Let’s make some memories!",
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="TAKE THE CONVERSATION OFFLINE"
        title="Old friends. New memories."
        description="From a cup of tea to a countrywide reunion. There’s a place for you."
        action={
          canCreate ? (
            <button className="button primary" onClick={() => setCreate(true)}>
              <Plus size={17} /> Create a meetup
            </button>
          ) : (
            <Link href="/sos" className="button light">
              <Coffee size={17} /> Suggest a meetup
            </Link>
          )
        }
      />
      <div className="event-banner">
        <Coffee size={30} />
        <div>
          <h2>Some things are better in person.</h2>
          <p>
            Pick your district, find a gathering, and bring your 2013 energy.
          </p>
        </div>
        <span className="handwritten">See you there ↗</span>
      </div>
      <div className="filter-bar">
        <h2 className="filter-heading">On the calendar</h2>
        <label className="select-wrapper">
          <MapPin size={16} />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Event district"
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <span className="muted live-label">
          <span className="status-dot" /> RSVPs refresh every minute
        </span>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorMessage message={query.error.message} />
      ) : query.data.events.length ? (
        <div className="events-grid">
          {query.data.events.map((e, i) => (
            <EventCard
              key={e.id}
              event={e}
              index={i}
              onRsvp={(e) => requireMember(() => void rsvp(e))}
              onDetails={setDetails}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="The calendar is open"
          description="No meetups in this district yet. Suggest one to the community."
        />
      )}
      {create && <EventDialog onClose={() => setCreate(false)} toast={toast} />}{" "}
      {details && (
        <EventDetails event={details} onClose={() => setDetails(null)} />
      )}
    </>
  );
}
function EventDetails({
  event,
  onClose,
}: {
  event: Event;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const photos = useQuery({
    queryKey: ["photos", event.id],
    queryFn: () =>
      api<{
        photos: {
          id: string;
          url: string;
          caption?: string;
          createdAt: string;
        }[];
      }>(`events/${event.id}/photos`),
  });
  return (
    <Dialog
      title={event.title}
      subtitle={`${event.location} · ${date(event.startsAt)}, ${time(event.startsAt)} BST`}
      onClose={onClose}
    >
      <p className="dialog-description">{event.description}</p>
      <a
        className="button light full-width"
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + ", " + event.district + ", Bangladesh")}`}
        target="_blank"
        rel="noreferrer"
      >
        <MapPin size={16} />
        Open location in Maps <ExternalLink size={14} />
      </a>
      <h3 className="timeline-title">The memory wall</h3>
      {photos.isPending ? (
        <Loading />
      ) : photos.data?.photos.length ? (
        <div className="photo-timeline">
          {photos.data.photos.map((p) => (
            <figure key={p.id}>
              <img
                src={p.url}
                alt={p.caption || "Meetup memory"}
                loading="lazy"
              />
              <figcaption>
                {p.caption} · {date(p.createdAt)}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="empty small-empty">
          <ImageIcon size={27} />
          <p>
            No memories shared yet. Photos will appear here after the meetup.
          </p>
        </div>
      )}
      {session && (
        <form
          className="form photo-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = e.currentTarget;
            try {
              await api(`events/${event.id}/photos`, {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
              });
              await client.invalidateQueries({
                queryKey: ["photos", event.id],
              });
              form.reset();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Share a memory (RSVP required)
            <input
              type="url"
              name="url"
              required
              pattern="https://.*"
              placeholder="https://…/your-photo.jpg"
            />
          </label>
          <label>
            Caption
            <input
              name="caption"
              required
              minLength={3}
              maxLength={200}
              placeholder="A moment worth remembering"
            />
          </label>
          {error && <ErrorMessage message={error} />}
          <button className="button light full-width" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <ImageIcon size={16} />
            )}
            Share photo link
          </button>
          <p className="field-note">
            Use a public HTTPS image link. Only share photos you have permission
            to post.
          </p>
        </form>
      )}
      <Link className="text-link" href="/expenses">
        Planning a shared bill? Split expenses <ArrowUpRight size={15} />
      </Link>
    </Dialog>
  );
}
function EventDialog({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: (s: string) => void;
}) {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Bring the batch together." onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await api("events", {
              method: "POST",
              body: JSON.stringify({
                ...f,
                capacity: Number(f.capacity),
                startsAt: new Date(String(f.startsAt) + "+06:00").toISOString(),
              }),
            });
            await client.invalidateQueries({ queryKey: ["events"] });
            onClose();
            toast("Your meetup is on the calendar.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Meetup name
          <input name="title" required minLength={5} maxLength={160} />
        </label>
        <label>
          What’s the plan?
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={3000}
          />
        </label>
        <div className="form-row">
          <label>
            District
            <select name="district">
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category">
              <option>Meetup</option>
              <option>Reunion</option>
              <option>Workshop</option>
            </select>
          </label>
        </div>
        <label>
          Venue
          <input name="location" required minLength={3} maxLength={180} />
        </label>
        <div className="form-row">
          <label>
            Date & time (Bangladesh)
            <input type="datetime-local" name="startsAt" required />
          </label>
          <label>
            Maximum attendees
            <input
              type="number"
              name="capacity"
              min="2"
              max="10000"
              defaultValue="50"
              required
            />
          </label>
        </div>
        {error && <ErrorMessage message={error} />}
        <button disabled={busy} className="button primary full-width">
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <CalendarDays size={16} />
          )}
          Create meetup
        </button>
      </form>
    </Dialog>
  );
}

function Expenses({
  requireMember,
  toast,
}: {
  requireMember: (a: () => void) => void;
  toast: (s: string) => void;
}) {
  const client = useQueryClient();
  const [total, setTotal] = useState("2400");
  const [people, setPeople] = useState("6");
  const [title, setTitle] = useState("Friday adda");
  const [busy, setBusy] = useState(false);
  const totalPaisa = Math.round(Number(total) * 100);
  const participants = Number(people);
  const valid =
    Number.isSafeInteger(totalPaisa) &&
    totalPaisa > 0 &&
    totalPaisa <= 100000000 &&
    Number.isInteger(participants) &&
    participants >= 2 &&
    participants <= 1000;
  const perPerson = valid ? Math.floor(totalPaisa / participants) : 0;
  const remainder = valid ? totalPaisa % participants : 0;
  const money = (p: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
    }).format(p / 100);
  const ledger = useQuery({
    queryKey: ["expenses"],
    queryFn: () =>
      api<{
        expenses: {
          id: string;
          title: string;
          totalPaisa: number;
          participants: number;
          perPersonPaisa: number;
          createdAt: string;
        }[];
      }>("expenses"),
  });
  async function save() {
    setBusy(true);
    try {
      await api("expenses", {
        method: "POST",
        body: JSON.stringify({ title, totalPaisa, participants }),
      });
      await client.invalidateQueries({ queryKey: ["expenses"] });
      toast("Expense saved to your ledger.");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="LESS MATH. MORE ADDA."
        title="Good times. Fair shares."
        description="Split the bill in seconds. Keep the friendship priceless."
      />
      <div className="expense-layout">
        <section className="calculator-card">
          <div className="calculator-heading">
            <span className="stat-icon">
              <Calculator size={23} />
            </span>
            <div>
              <h2>The batchmate bill splitter</h2>
              <p>Calculate freely. Sign in to save your ledger.</p>
            </div>
          </div>
          <div className="form">
            <label>
              What was the occasion?
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </label>
            <div className="form-row">
              <label>
                Total bill (BDT)
                <input
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </label>
              <label>
                Number of people
                <input
                  type="number"
                  min="2"
                  max="1000"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="split-result">
            <span>EACH PERSON PAYS</span>
            <strong>{valid ? money(perPerson) : "—"}</strong>
            <p>
              {valid
                ? remainder
                  ? `${remainder} ${remainder === 1 ? "person pays" : "people pay"} ৳0.01 extra to balance the bill.`
                  : "Split evenly. Everyone’s happy."
                : "Enter a positive bill and 2–1,000 people."}
            </p>
          </div>
          <div className="calculator-actions">
            <button
              className="button primary"
              disabled={!valid || !title.trim() || busy}
              onClick={() => requireMember(() => void save())}
            >
              {busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <CheckCheck size={17} />
              )}
              Save expense
            </button>
            <button
              className="button light"
              disabled={!valid}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${title}: ${money(totalPaisa)} ÷ ${participants}. Each: ${money(perPerson)}${remainder ? `; ${remainder} people add ৳0.01` : ""}. Calculated on SSC13BD.`,
                  );
                  toast("Split copied. Share it with your batchmates.");
                } catch {
                  toast(
                    "Clipboard unavailable. You can copy the amounts displayed above.",
                  );
                }
              }}
            >
              <Copy size={16} />
              Copy split
            </button>
          </div>
        </section>
        <section className="ledger-card">
          <SectionTitle
            title="Your shared memories"
            subtitle="Saved splits from your gatherings"
          />
          {ledger.isPending ? (
            <Loading />
          ) : ledger.data?.expenses.length ? (
            <div className="ledger-list">
              {ledger.data.expenses.map((e) => (
                <div key={e.id}>
                  <span className="ledger-icon">
                    <Coffee size={20} />
                  </span>
                  <div>
                    <strong>{e.title}</strong>
                    <small>
                      {e.participants} people · {date(e.createdAt)}
                    </small>
                  </div>
                  <b>{money(e.totalPaisa)}</b>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Your ledger starts here"
              description="Saved expenses will appear here after you sign in and verify your batch."
            />
          )}
          <div className="info-box">
            <CircleHelp size={19} />
            <p>
              This calculator tracks shared costs. Payments happen directly
              between friends.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

function LoginDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const config = useQuery({
    queryKey: ["auth-config"],
    queryFn: () =>
      api<{ emailAuthEnabled: boolean; facebookAuthEnabled: boolean }>(
        "config",
      ),
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!sent) {
        await api("otp/request", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setSent(true);
      } else {
        const result = await signIn("credentials", {
          email,
          code: otp,
          redirect: false,
        });
        if (result?.error)
          throw new Error(
            "That code is incorrect or expired. Request a new code and try again.",
          );
        window.location.href = "/verification";
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="Your batch is right here."
      subtitle="Sign in, get verified, and find your people again."
      onClose={onClose}
    >
      <button
        disabled={!config.data?.facebookAuthEnabled}
        className="button facebook full-width"
        onClick={() =>
          void signIn("facebook", { callbackUrl: "/verification" })
        }
      >
        <span className="facebook-symbol">f</span>Continue with Facebook
      </button>
      {!config.data?.facebookAuthEnabled && (
        <p className="field-note">
          Facebook sign-in is available once the community’s app credentials are
          connected.
        </p>
      )}
      <div className="or-divider">
        <span>or use your email</span>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
          />
        </label>
        {sent && (
          <label>
            Your one-time code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
            />
            <small>Check your inbox. Your code expires in 10 minutes.</small>
          </label>
        )}
        {error && <ErrorMessage message={error} />}
        <button
          disabled={busy || !config.data?.emailAuthEnabled}
          className="button primary full-width"
        >
          {busy ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Mail size={17} />
          )}{" "}
          {sent ? "Verify code & sign in" : "Email me a sign-in code"}
        </button>
        {sent && (
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setSent(false);
              setOtp("");
            }}
          >
            Use a different email or resend
          </button>
        )}
      </form>
      {!config.data?.emailAuthEnabled && (
        <p className="field-note">
          Email sign-in is awaiting the database and email service connection.
          This preview is read-only.
        </p>
      )}
      <p className="login-note">
        <ShieldCheck size={14} />
        Your SSC details stay private and are reviewed only by moderators.
      </p>
    </Dialog>
  );
}

function Verification({
  me,
  signIn,
  toast,
}: {
  me?: Me;
  signIn: () => void;
  toast: (s: string) => void;
}) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editProfile, setEditProfile] = useState(false);
  const verified = me?.user?.batchVerified;
  const pending = me?.verification?.status === "PENDING";
  return (
    <>
      <Heading
        eyebrow="THE CLASS OF 2013. FOR REAL."
        title="A familiar bond. A verified batch."
        description="A little verification keeps this community meaningful for everyone."
      />
      <div className="verification-layout">
        <section className="verification-info">
          <div className="verification-seal">
            <BadgeCheck size={52} />
          </div>
          <h2>
            Our trust starts
            <br />
            with our roots.
          </h2>
          <p>
            Share your SSC details so a moderator can confirm you’re part of the
            2013 batch.
          </p>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Sign in to your account</h3>
                <p>Use Facebook or your personal email.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Share your batch details</h3>
                <p>SSC board, school, roll, and registration.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>A moderator welcomes you</h3>
                <p>
                  Post requests, RSVP, and join the directory after approval.
                </p>
              </div>
            </li>
          </ol>
          <div className="privacy-note">
            <ShieldCheck size={19} />
            <span>
              Your roll and registration numbers are never shown publicly.
            </span>
          </div>
        </section>
        <section className="verification-form-card">
          {verified ? (
            <div className="verification-success">
              <BadgeCheck size={60} />
              <Pill>YOU’RE ONE OF US</Pill>
              <h2>Welcome to the batch.</h2>
              <p>
                Your SSC membership is verified. Your next connection is
                waiting.
              </p>
              <Link href="/directory" className="button primary">
                Meet your batchmates <ArrowRight size={16} />
              </Link>
              <button
                className="text-link"
                onClick={() => setEditProfile(true)}
              >
                Edit your directory profile <ArrowUpRight size={14} />
              </button>
              <button className="text-link" onClick={()=>void signOut({callbackUrl:"/"})}>Sign out</button>
            </div>
          ) : pending ? (
            <div className="verification-success pending">
              <Clock3 size={52} />
              <Pill kind="amber">IN THE MODERATION QUEUE</Pill>
              <h2>You’re nearly home.</h2>
              <p>
                A moderator will review your details. Your status updates here
                after a decision.
              </p>
              <button
                className="button light"
                onClick={() =>
                  void client.invalidateQueries({ queryKey: ["me"] })
                }
              >
                Check status <Activity size={16} />
              </button>
            </div>
          ) : !me?.user ? (
            <div className="verification-success">
              <GraduationCap size={55} />
              <h2>First, let’s say hello.</h2>
              <p>Sign in to submit your SSC information securely.</p>
              <button className="button primary" onClick={signIn}>
                Sign in to get verified <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <h2>Your SSC story</h2>
              <p className="muted">
                All fields are reviewed privately by our moderators.
              </p>
              {me.verification?.reviewNote && (
                <div className="info-box">
                  Previous review: {me.verification.reviewNote}
                </div>
              )}
              <form
                className="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  try {
                    await api("me", {
                      method: "PATCH",
                      body: JSON.stringify({
                        name: String(f.name),
                        district: String(f.district),
                        profession: String(f.profession),
                        organization: String(f.organization),
                        directoryVisible: f.directoryVisible === "on",
                      }),
                    });
                    await api("verification", {
                      method: "POST",
                      body: JSON.stringify({ ...f, passingYear: 2013 }),
                    });
                    await client.invalidateQueries({ queryKey: ["me"] });
                    toast("Your verification request is with the moderators.");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Your full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={me.user.name}
                  />
                </label>
                <label>
                  School name
                  <input
                    name="school"
                    required
                    minLength={3}
                    maxLength={180}
                    placeholder="Your school in 2013"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Education board
                    <select name="board">
                      {[
                        "Dhaka",
                        "Chattogram",
                        "Rajshahi",
                        "Cumilla",
                        "Jashore",
                        "Barishal",
                        "Sylhet",
                        "Dinajpur",
                        "Madrasah",
                        "Technical",
                      ].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Passing year
                    <input value="2013" readOnly />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    SSC roll number
                    <input
                      name="roll"
                      inputMode="numeric"
                      pattern="[0-9]{5,10}"
                      required
                      minLength={5}
                      maxLength={10}
                    />
                  </label>
                  <label>
                    Registration number
                    <input
                      name="registration"
                      inputMode="numeric"
                      pattern="[0-9]{6,20}"
                      required
                      minLength={6}
                      maxLength={20}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Your district
                    <select name="district">
                      {districts.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Profession
                    <select name="profession">
                      {professions.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Organization (optional)
                  <input
                    name="organization"
                    maxLength={180}
                    placeholder="Workplace, hospital, or institution"
                  />
                </label>
                <label className="checkbox-label">
                  <input name="directoryVisible" type="checkbox" />
                  List my name, district, and professional profile in the public
                  alumni directory after approval.
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" required />I confirm that I passed SSC
                  in 2013 and consent to a private moderation review.
                </label>
                {error && <ErrorMessage message={error} />}
                <button className="button primary full-width" disabled={busy}>
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <ShieldCheck size={17} />
                  )}
                  Submit for verification
                </button>
              </form>
            </>
          )}
        </section>
      </div>
      {editProfile && (
        <ProfileDialog
          me={me}
          onClose={() => setEditProfile(false)}
          toast={toast}
        />
      )}
    </>
  );
}
function ProfileDialog({
  me,
  onClose,
  toast,
}: {
  me?: Me;
  onClose: () => void;
  toast: (s: string) => void;
}) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      title="Let your people find you."
      subtitle="Choose what you share with the community."
      onClose={onClose}
    >
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await api("me", {
              method: "PATCH",
              body: JSON.stringify({
                ...f,
                directoryVisible: f.directoryVisible === "on",
              }),
            });
            await client.invalidateQueries({ queryKey: ["me"] });
            await client.invalidateQueries({ queryKey: ["directory"] });
            await client.invalidateQueries({ queryKey: ["overview"] });
            toast("Your directory profile has been updated.");
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Your name
          <input
            name="name"
            defaultValue={me?.user?.name}
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <div className="form-row">
          <label>
            District
            <select
              name="district"
              defaultValue={me?.user?.district || "Dhaka"}
            >
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Profession
            <select
              name="profession"
              defaultValue={me?.user?.profession || "Corporate"}
            >
              {professions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Organization
          <input
            name="organization"
            defaultValue={me?.user?.organization}
            maxLength={160}
          />
        </label>
        <label>
          A little about you
          <textarea
            name="bio"
            defaultValue={me?.user?.bio}
            maxLength={500}
            rows={3}
            placeholder="What can batchmates reach out to you about?"
          />
        </label>
        <label>
          Blood group (optional)
          <select name="bloodGroup" defaultValue={me?.user?.bloodGroup || ""}>
            <option value="">Prefer not to share</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="directoryVisible"
            defaultChecked={me?.user?.directoryVisible}
          />
          Show my professional profile publicly in the alumni directory. My
          email and SSC identifiers stay private.
        </label>
        {error && <ErrorMessage message={error} />}
        <button className="button primary full-width" disabled={busy}>
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Check size={16} />
          )}
          Save my profile
        </button>
      </form>
    </Dialog>
  );
}
function Moderation({ me, toast }: { me?: Me; toast: (s: string) => void }) {
  const client = useQueryClient();
  const allowed = !!me?.user && ["ADMIN", "MODERATOR"].includes(me.user.role);
  const query = useQuery({
    queryKey: ["verification-queue"],
    queryFn: () =>
      api<{
        requests: {
          id: string;
          school: string;
          board: string;
          roll: string;
          registration: string;
          user: { name: string; email: string };
        }[];
      }>("verification"),
    enabled: allowed,
  });
  const [busy, setBusy] = useState(false);
  async function review(id: string, status: string) {
    const reviewNote =
      status === "REJECTED"
        ? window.prompt("Explain what the member needs to correct:")
        : "Confirmed SSC batch membership.";
    if (reviewNote === null) return;
    setBusy(true);
    try {
      await api(`verification/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNote }),
      });
      await client.invalidateQueries({ queryKey: ["verification-queue"] });
      toast("Review saved.");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="COMMUNITY STEWARDSHIP"
        title="Welcome the next batchmate."
        description="Review SSC details carefully. Approval confirms batch membership only."
      />
      {!allowed ? (
        <Empty
          title="Moderator access required"
          description="Only authorized community moderators can review private SSC information."
        />
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorMessage message={query.error.message} />
      ) : query.data?.requests.length ? (
        <div className="moderation-list">
          {query.data.requests.map((r) => (
            <article className="moderation-card" key={r.id}>
              <h3>{r.user.name}</h3>
              <p>{r.user.email}</p>
              <dl>
                <dt>School</dt>
                <dd>{r.school}</dd>
                <dt>Board</dt>
                <dd>{r.board}</dd>
                <dt>Roll</dt>
                <dd>{r.roll}</dd>
                <dt>Registration</dt>
                <dd>{r.registration}</dd>
              </dl>
              <div className="form-row">
                <button
                  disabled={busy}
                  className="button primary"
                  onClick={() => void review(r.id, "APPROVED")}
                >
                  Approve batch membership
                </button>
                <button
                  disabled={busy}
                  className="button light"
                  onClick={() => void review(r.id, "REJECTED")}
                >
                  Request correction
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="All caught up"
          description="New verification requests will appear here."
        />
      )}
    </>
  );
}
