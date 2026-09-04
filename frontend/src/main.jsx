import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./style.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "")
).replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const nav = [
  ["dashboard", "⌂", "Dashboard"],
  ["products", "▦", "Products"],
  ["inventory", "◫", "Inventory"],
  ["warehouse", "▥", "Warehouse"],
  ["orders", "◉", "Orders"],
];

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", r.data.token);
      localStorage.setItem("user", JSON.stringify(r.data.user));
      onLogin(r.data.user);
    } catch (err) {
      const status = err?.response?.status;

      if (!API_URL) {
        setError(
          "Backend URL is not configured. Add VITE_API_URL in Vercel."
        );
      } else if (!err?.response) {
        setError(
          "Unable to connect to the server. Check the Render backend URL and CORS settings."
        );
      } else if (status === 401) {
        setError("Invalid email or password. Use the demo account shown below.");
      } else {
        setError(
          err?.response?.data?.message ||
          "Login failed. Please try again."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-art">
        <div className="brand-mark">SS</div>
        <span className="eyebrow">SMART WAREHOUSE PLATFORM</span>
        <h1>Move stock.<br /><span>Move business.</span></h1>
        <p>Barcode-first inventory management with warehouse visibility and delivery tracking in one workspace.</p>
        <div className="login-features">
          <div><b>01</b><span>Scan & receive stock</span></div>
          <div><b>02</b><span>Locate every bin</span></div>
          <div><b>03</b><span>Pick, verify & deliver</span></div>
        </div>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="mobile-brand"><div className="brand-mark small">SS</div><b>SmartStock</b></div>
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in to your workspace</h2>
        <p className="muted">Manage products, stock, orders and deliveries.</p>
        <label>Email address</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" />
        <label>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        <button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in  →"}</button>
        <div className="demo-note"><span>Demo access</span><b>admin@example.com</b><small>Password: 123456</small></div>
        {error && <div className="alert error">{error}</div>}
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");

      if (!token || !rawUser) {
        return null;
      }

      const parsed = JSON.parse(rawUser);

      if (!parsed || !parsed.id || !parsed.role) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });
  const [tab, setTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Login onLogin={setUser} />;

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const allowed = user.role === "DELIVERY" ? ["delivery"] : nav.map(x => x[0]);

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo-row"><div className="brand-mark">SS</div><div><strong>SmartStock</strong><small>Inventory OS</small></div></div>
          <button className="close-mobile" onClick={() => setMobileOpen(false)}>×</button>
        </div>
        <div className="workspace"><span className="live-dot"></span> Warehouse workspace</div>
        <div className="nav-label">OPERATIONS</div>
        <nav>
          {nav.map(([id, icon, label]) => allowed.includes(id) && (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMobileOpen(false); }}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
          {allowed.includes("delivery") && (
            <button className={tab === "delivery" ? "active" : ""} onClick={() => { setTab("delivery"); setMobileOpen(false); }}>
              <span className="nav-icon">↗</span>Deliveries
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini"><div className="avatar">{(user.name || "U")[0]}</div><div><b>{user.name}</b><small>{user.role}</small></div></div>
          <button className="logout" onClick={logout}>↪ <span>Sign out</span></button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
          <div className="crumb"><span>Workspace</span><b>/</b><strong>{tab === "delivery" ? "Deliveries" : titleCase(tab)}</strong></div>
          <div className="top-actions">
            <div className="status-pill"><span className="live-dot"></span> System online</div>
            <div className="top-user"><div className="avatar">{(user.name || "U")[0]}</div><span>{user.name}</span></div>
          </div>
        </header>

        <div className="content">
          {tab === "dashboard" && <Dashboard setTab={setTab} />}
          {tab === "products" && <Products />}
          {tab === "inventory" && <Inventory />}
          {tab === "warehouse" && <Warehouse />}
          {tab === "orders" && <Orders />}
          {tab === "delivery" && <Delivery />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ setTab }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get("/dashboard/stats").then(r => setStats(r.data)).catch(() => {});
    api.get("/orders").then(r => setOrders(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const cards = stats ? [
    ["Total products", stats.products, "▦", "products"],
    ["Units in stock", stats.totalStock, "◫", "inventory"],
    ["Total orders", stats.orders, "◉", "orders"],
    ["Active deliveries", stats.activeDeliveries, "↗", "delivery"],
  ] : [];

  return <Page eyebrow="OVERVIEW" title="Good to see you." subtitle="Here’s what is happening across your inventory today.">
    <div className="quick-row">
      <button className="quick primary" onClick={() => setTab("inventory")}><span>＋</span><div><b>Receive stock</b><small>Scan a barcode and store it</small></div></button>
      <button className="quick" onClick={() => setTab("orders")}><span>＋</span><div><b>View orders</b><small>Track picking and fulfilment</small></div></button>
      <button className="quick" onClick={() => setTab("warehouse")}><span>⌗</span><div><b>Warehouse map</b><small>See bin capacity at a glance</small></div></button>
    </div>

    <div className="stat-grid">
      {cards.map(([label, value, icon, target]) => <button className="stat-card" key={label} onClick={() => setTab(target)}>
        <div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value ?? "—"}</strong><small>Live from warehouse</small></div><i>↗</i>
      </button>)}
    </div>

    <div className="section-grid">
      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">FULFILMENT</span><h3>Core inventory flow</h3></div><span className="tag">LIVE</span></div>
        <div className="flow">
          {["Scan", "Store", "Locate", "Pick", "Verify", "Track", "Deliver"].map((x, i) => <React.Fragment key={x}><div className="flow-step"><span>{String(i + 1).padStart(2, "0")}</span><b>{x}</b></div>{i < 6 && <em>→</em>}</React.Fragment>)}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">RECENT ORDERS</span><h3>Latest activity</h3></div><button className="text-btn" onClick={() => setTab("orders")}>View all →</button></div>
        {orders.length ? orders.map(o => <div className="activity" key={o.id}><div className="activity-icon">◉</div><div><b>{o.order_number}</b><small>{o.customer_name || "Customer"} · {o.status}</small></div><span className={`badge ${statusClass(o.status)}`}>{prettyStatus(o.status)}</span></div>) : <Empty text="No orders yet." />}
      </section>
    </div>
  </Page>;
}

function Products() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ barcode: "", name: "", category: "", description: "", minimumStock: 5 });
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => api.get("/products", { params: { q: query } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(load, [query]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await api.post("/products", form); setForm({ barcode: "", name: "", category: "", description: "", minimumStock: 5 }); setMsg("Product added successfully."); load(); }
    catch (e) { setMsg(e.response?.data?.message || "Could not add product."); }
    finally { setBusy(false); }
  }

  return <Page eyebrow="CATALOGUE" title="Products" subtitle="Create and manage every barcode-linked product.">
    <section className="panel form-panel">
      <div className="panel-head"><div><h3>Add a product</h3><p>Every item gets a unique barcode identity.</p></div></div>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Barcode" value={form.barcode} onChange={v => setForm({...form, barcode:v})} placeholder="8901234567890" required />
        <Field label="Product name" value={form.name} onChange={v => setForm({...form, name:v})} placeholder="Wireless Mouse" required />
        <Field label="Category" value={form.category} onChange={v => setForm({...form, category:v})} placeholder="Electronics" />
        <Field label="Minimum stock" type="number" value={form.minimumStock} onChange={v => setForm({...form, minimumStock:v})} />
        <div className="form-actions"><button className="primary" disabled={busy}>{busy ? "Adding…" : "＋ Add product"}</button>{msg && <span className={msg.includes("success") ? "success-text" : "error-text"}>{msg}</span>}</div>
      </form>
    </section>
    <DataSection title="Product catalogue" count={rows.length}>
      <div className="table-toolbar"><div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by product or barcode…" /></div><span className="muted">{rows.length} results</span></div>
      <Table rows={rows} cols={[["barcode","Barcode"],["name","Product"],["category","Category"],["minimum_stock","Min. stock"]]} />
    </DataSection>
  </Page>;
}

function Inventory() {
  const [rows, setRows] = useState([]);
  const [barcode, setBarcode] = useState("8901234567890");
  const [qty, setQty] = useState(10);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);

  const load = () => api.get("/inventory").then(r => setRows(r.data)).catch(() => {});
  useEffect(load, []);

  async function receive(e) {
    e.preventDefault(); setMsg(""); setError(false);
    try {
      const r = await api.post("/inventory/inward", { barcode, quantity: +qty });
      setMsg(`✓ ${r.data.product.name}: +${qty} units stored at ${r.data.row} → ${r.data.location}.`);
      load();
    } catch (e) { setError(true); setMsg(e.response?.data?.message || "Unable to receive stock."); }
  }

  return <Page eyebrow="STOCK CONTROL" title="Inventory" subtitle="Receive stock with a barcode, then see exactly where it was stored.">
    <section className="scan-card">
      <div className="scan-copy"><div className="scan-symbol">⌁</div><div><span className="eyebrow">BARCODE RECEIVING</span><h3>Scan & store inventory</h3><p>Enter a product barcode and quantity. SmartStock automatically selects an available bin.</p></div></div>
      <form className="scan-form" onSubmit={receive}>
        <label>Barcode<input autoFocus value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan barcode…" /></label>
        <label>Quantity<input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} /></label>
        <button className="primary">Receive stock →</button>
      </form>
      {msg && <div className={`alert ${error ? "error" : "success"}`}>{msg}</div>}
    </section>
    <DataSection title="Current stock" count={rows.length}>
      <Table rows={rows} cols={[["name","Product"],["barcode","Barcode"],["quantity","Units"],["row_code","Row"],["bin_code","Bin"]]} />
    </DataSection>
  </Page>;
}

function Warehouse() {
  const [rows, setRows] = useState([]);
  useEffect(() => api.get("/warehouse/map").then(r => setRows(r.data)).catch(() => {}), []);
  const grouped = useMemo(() => rows.reduce((a, b) => ((a[b.row_code] ||= []).push(b), a), {}), [rows]);

  return <Page eyebrow="WAREHOUSE" title="Warehouse map" subtitle="A live view of every bin, its capacity and availability.">
    <div className="legend"><span><i className="dot empty"></i> Empty</span><span><i className="dot available"></i> Available</span><span><i className="dot full"></i> Full</span></div>
    <div className="warehouse-grid">
      {Object.entries(grouped).map(([row, bins]) => <section className="row-card" key={row}>
        <div className="row-head"><div><b>ROW {row}</b><small>{bins.length} bins</small></div><span>{bins.reduce((s,b) => s + b.current_quantity, 0)} / {bins.reduce((s,b) => s + b.capacity, 0)} units</span></div>
        <div className="bin-grid">{bins.map(b => <div className={`bin ${b.status.toLowerCase()}`} key={b.id}><div><b>{b.bin_code}</b><span>{prettyStatus(b.status)}</span></div><strong>{b.current_quantity}</strong><small>/ {b.capacity}</small><div className="capacity"><i style={{width: `${Math.min(100, b.capacity ? (b.current_quantity / b.capacity) * 100 : 0)}%`}} /></div></div>)}</div>
      </section>)}
    </div>
  </Page>;
}

function Orders() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const load = () => api.get("/orders", { params: { q: query } }).then(r => setRows(r.data)).catch(() => {});
  useEffect(load, [query]);

  return <Page eyebrow="FULFILMENT" title="Orders" subtitle="Search customer orders and monitor their fulfilment status.">
    <DataSection title="Order queue" count={rows.length}>
      <div className="table-toolbar"><div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order number or customer…" /></div></div>
      <Table rows={rows} cols={[["order_number","Order"],["customer_name","Customer"],["customer_address","Delivery address"],["status","Status"],["created_at","Created"]]} badges={["status"]} />
    </DataSection>
  </Page>;
}

function Delivery() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/delivery/orders").then(r => setRows(r.data)).catch(() => {});
  useEffect(load, []);

  async function action(o) {
    if (o.status === "READY") await api.post(`/delivery/orders/${o.id}/start`);
    else await api.post(`/delivery/orders/${o.id}/complete`);
    load();
  }

  return <Page eyebrow="LAST MILE" title="Deliveries" subtitle="Move ready orders from the warehouse to the customer.">
    <div className="delivery-list">{rows.length ? rows.map(o => <article className="delivery-card" key={o.id}>
      <div className="delivery-number"><span>ORDER</span><b>{o.order_number}</b><em className={`badge ${statusClass(o.status)}`}>{prettyStatus(o.status)}</em></div>
      <div className="delivery-info"><div><small>CUSTOMER</small><b>{o.customer_name || "—"}</b></div><div><small>DESTINATION</small><b>{o.customer_address || "Address not provided"}</b></div></div>
      <button className={o.status === "READY" ? "primary" : "success-btn"} onClick={() => action(o)}>{o.status === "READY" ? "Start delivery →" : "Mark delivered ✓"}</button>
    </article>) : <Empty text="No ready deliveries right now." />}</div>
  </Page>;
}

function Page({ eyebrow, title, subtitle, children }) {
  return <><div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div><div className="date-chip">● LIVE&nbsp;&nbsp; {new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</div></div>{children}</>;
}
function DataSection({ title, count, children }) { return <section className="panel data-panel"><div className="panel-head"><div><h3>{title}</h3>{count !== undefined && <span className="count">{count} records</span>}</div></div>{children}</section>; }
function Field({ label, value, onChange, placeholder, type="text", required }) { return <label>{label}<input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>; }
function Table({ rows, cols, badges=[] }) {
  return <div className="table-wrap">{rows.length ? <table><thead><tr>{cols.map(([key,label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={r.id || i}>{cols.map(([key]) => <td key={key}>{badges.includes(key) ? <span className={`badge ${statusClass(r[key])}`}>{prettyStatus(r[key])}</span> : key === "created_at" && r[key] ? new Date(r[key]).toLocaleDateString() : (r[key] ?? "—")}</td>)}</tr>)}</tbody></table> : <Empty text="No records found." />}</div>;
}
function Empty({ text }) { return <div className="empty">{text}</div>; }
function titleCase(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
function prettyStatus(x) { return String(x || "").replaceAll("_"," ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
function statusClass(x) { return String(x || "").toLowerCase().replaceAll("_","-"); }

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("SmartStock frontend error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f6f7fb",
          fontFamily: "DM Sans, Arial, sans-serif"
        }}>
          <div style={{
            maxWidth: "520px",
            width: "100%",
            background: "#fff",
            border: "1px solid #e7eaf0",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 15px 45px rgba(16,24,40,.08)"
          }}>
            <div style={{
              fontWeight: 800,
              letterSpacing: "1px",
              fontSize: "11px",
              color: "#c94c59"
            }}>SMARTSTOCK ERROR</div>
            <h2 style={{ margin: "8px 0", fontFamily: "Space Grotesk, Arial" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
              Refresh the page. If the problem continues, open the browser
              console and check the first error shown there.
            </p>
            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                marginTop: "16px",
                whiteSpace: "pre-wrap",
                fontSize: "11px",
                color: "#9f3341"
              }}>
                {String(this.state.error.stack || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
