import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./style.css";

const BACKEND_URL = "https://tracknest-4sp1.onrender.com";

function apiBase() {
  let url = (import.meta.env.VITE_API_URL || BACKEND_URL).trim().replace(/\/+$/, "");
  if (url.endsWith("/api")) url = url.slice(0, -4);
  return `${url}/api`;
}

const api = axios.create({
  baseURL: apiBase(),
  timeout: 15000,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const navItems = [
  ["dashboard", "⌂", "Dashboard"],
  ["products", "▦", "Products"],
  ["inventory", "▣", "Inventory"],
  ["warehouse", "⌘", "Warehouse"],
  ["orders", "◈", "Orders"],
  ["delivery", "➤", "Delivery"]
];

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong.";
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("123456");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-art">
          <div className="brand-mark">S</div>
          <div>
            <div className="eyebrow">SMARTSTOCK</div>
            <h1>Inventory OS</h1>
            <p>Barcode-first inventory, warehouse and delivery control.</p>
          </div>
          <div className="login-features">
            <div><b>01</b><span>Scan & receive stock</span></div>
            <div><b>02</b><span>Locate every bin</span></div>
            <div><b>03</b><span>Track orders to delivery</span></div>
          </div>
        </div>

        <div className="login-form">
          <div className="eyebrow">WELCOME BACK</div>
          <h2>Sign in to your workspace</h2>
          <p>Manage products, stock, orders and deliveries.</p>

          <form onSubmit={submit}>
            <label>Email address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />

            <label>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />

            <button className="primary full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="demo-note">
            <div className="eyebrow">DEMO ACCESS</div>
            <b>admin@example.com</b>
            <small>Password: 123456</small>
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>
      <span>›</span>
    </div>
  );
}

function Dashboard({ user, go }) {
  const [stats, setStats] = useState({ products: 0, totalStock: 0, orders: 0, activeDeliveries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats").then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHead eyebrow="OVERVIEW" title={`Good to see you, ${user.name}.`} text="Your warehouse at a glance." />
      <div className="quick-row">
        <button className="quick primary" onClick={() => go("inventory")}><span>＋</span><div><b>Receive stock</b><small>Scan a barcode and put stock away</small></div></button>
        <button className="quick" onClick={() => go("products")}><span>＋</span><div><b>Add product</b><small>Create a new catalogue item</small></div></button>
        <button className="quick" onClick={() => go("orders")}><span>◈</span><div><b>Manage orders</b><small>Pick and prepare shipments</small></div></button>
      </div>
      <div className="stat-grid">
        <Stat icon="▦" label="PRODUCTS" value={loading ? "—" : stats.products} note="Catalogue items" />
        <Stat icon="▣" label="UNITS IN STOCK" value={loading ? "—" : stats.totalStock} note="Across all bins" />
        <Stat icon="◈" label="ORDERS" value={loading ? "—" : stats.orders} note="All orders" />
        <Stat icon="➤" label="ACTIVE DELIVERIES" value={loading ? "—" : stats.activeDeliveries} note="Currently moving" />
      </div>
      <div className="section-grid">
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">WORKFLOW</div><h3>From barcode to doorstep</h3></div></div>
          <div className="flow">
            {["Receive", "Store", "Pick", "Deliver"].map((x, i) => <div className="flow-step" key={x}><b>0{i + 1}</b><span>{x}</span><small>{["Scan stock", "Find a bin", "Verify items", "Track route"][i]}</small></div>)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">SYSTEM</div><h3>Live status</h3></div><span className="tag ready">ONLINE</span></div>
          <div className="activity"><div className="activity-icon">✓</div><div><b>API connected</b><small>SmartStock backend is reachable</small></div></div>
          <div className="activity"><div className="activity-icon">⌁</div><div><b>Barcode workflow ready</b><small>Warehouse scanning is available</small></div></div>
        </div>
      </div>
    </>
  );
}

function Products({ user }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ barcode: "", name: "", category: "", description: "", minimumStock: 5 });
  const [message, setMessage] = useState("");

  async function load() {
    try { setItems((await api.get("/products", { params: { q } })).data); } catch (e) { setMessage(errorMessage(e)); }
  }
  useEffect(() => { load(); }, [q]);

  async function add(e) {
    e.preventDefault(); setMessage("");
    try {
      await api.post("/products", form);
      setForm({ barcode: "", name: "", category: "", description: "", minimumStock: 5 });
      setMessage("Product added successfully.");
      load();
    } catch (e) { setMessage(errorMessage(e)); }
  }

  return (
    <>
      <PageHead eyebrow="CATALOGUE" title="Products" text="Create and search your product master." />
      <div className="section-grid">
        <div className="form-panel">
          <div className="eyebrow">NEW PRODUCT</div><h3>Add a product</h3>
          <form onSubmit={add}>
            <div className="form-grid">
              <Field label="Barcode"><input value={form.barcode} required onChange={e => setForm({...form, barcode:e.target.value})} placeholder="8901234567890" /></Field>
              <Field label="Product name"><input value={form.name} required onChange={e => setForm({...form, name:e.target.value})} placeholder="Wireless Mouse" /></Field>
              <Field label="Category"><input value={form.category} onChange={e => setForm({...form, category:e.target.value})} placeholder="Electronics" /></Field>
              <Field label="Minimum stock"><input type="number" min="0" value={form.minimumStock} onChange={e => setForm({...form, minimumStock:e.target.value})} /></Field>
            </div>
            <Field label="Description"><input value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Optional description" /></Field>
            <button className="primary">Add product</button>
          </form>
          {message && <div className="success-text">{message}</div>}
        </div>
        <div className="data-panel">
          <div className="table-toolbar"><div><div className="eyebrow">PRODUCT MASTER</div><h3>{items.length} products</h3></div><input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or barcode..." /></div>
          <Table headers={["Product", "Barcode", "Category", "Min stock"]} rows={items.map(p => [<b>{p.name}</b>, p.barcode, p.category || "—", p.minimum_stock ?? p.minimumStock ?? 5])} />
        </div>
      </div>
    </>
  );
}

function Inventory() {
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  async function load() {
    try { setItems((await api.get("/inventory")).data); } catch (e) { setMessage(errorMessage(e)); }
  }
  useEffect(() => { load(); }, []);

  async function inward(e) {
    e.preventDefault(); setMessage("");
    try {
      const r = await api.post("/inventory/inward", { barcode, quantity: Number(quantity) });
      setMessage(`${r.data.product.name}: +${r.data.quantityAdded} units → ${r.data.row}-${r.data.location}`);
      setBarcode(""); setQuantity(1); load();
    } catch (e) { setMessage(errorMessage(e)); }
  }

  return (
    <>
      <PageHead eyebrow="WAREHOUSE" title="Inventory" text="Receive stock by barcode and see its bin location." />
      <div className="section-grid">
        <div className="scan-card">
          <div className="scan-symbol">▦</div><div className="eyebrow">BARCODE RECEIVING</div><h3>Scan stock inward</h3><p>Enter a product barcode and quantity. SmartStock selects an available bin automatically.</p>
          <form className="scan-form" onSubmit={inward}>
            <input autoFocus value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan / enter barcode" required />
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
            <button className="primary">Receive stock</button>
          </form>
          {message && <div className={message.includes("→") ? "success" : "error"}>{message}</div>}
        </div>
        <div className="data-panel">
          <div className="table-toolbar"><div><div className="eyebrow">CURRENT STOCK</div><h3>{items.length} stock lines</h3></div></div>
          <Table headers={["Product", "Barcode", "Quantity", "Location"]} rows={items.map(i => [<b>{i.name}</b>, i.barcode, i.quantity, `${i.row_code} → ${i.bin_code}`])} />
        </div>
      </div>
    </>
  );
}

function Warehouse() {
  const [bins, setBins] = useState([]);
  useEffect(() => { api.get("/warehouse/map").then(r => setBins(r.data)).catch(() => {}); }, []);
  const rows = useMemo(() => {
    const m = {};
    bins.forEach(b => (m[b.row_code] ||= []).push(b));
    return m;
  }, [bins]);

  return (
    <>
      <PageHead eyebrow="LOCATION MAP" title="Warehouse" text="Visualise rows, bins and available capacity." />
      <div className="legend"><span><i className="dot available"></i> Available</span><span><i className="dot full"></i> Full</span><span><i className="dot empty"></i> Empty</span></div>
      <div className="warehouse-grid">
        {Object.keys(rows).sort().map(row => (
          <div className="row-card" key={row}>
            <div className="row-head"><b>ROW {row}</b><small>{rows[row].length} bins</small></div>
            <div className="bin-grid">{rows[row].map(b => <div className={`bin ${String(b.status).toLowerCase()}`} key={b.id}><b>{b.bin_code}</b><small>{b.current_quantity}/{b.capacity}</small></div>)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customerName:"", customerPhone:"", customerAddress:"", productId:"", quantity:1 });
  const [message, setMessage] = useState("");

  async function load() {
    try { setOrders((await api.get("/orders")).data); } catch(e) { setMessage(errorMessage(e)); }
  }
  useEffect(() => { load(); api.get("/products").then(r => setProducts(r.data)).catch(()=>{}); }, []);

  async function create(e) {
    e.preventDefault(); setMessage("");
    try {
      await api.post("/orders", { customerName:form.customerName, customerPhone:form.customerPhone, customerAddress:form.customerAddress, items: [{ productId:Number(form.productId), quantity:Number(form.quantity) }] });
      setForm({ customerName:"", customerPhone:"", customerAddress:"", productId:"", quantity:1 });
      setMessage("Order created."); load();
    } catch(e) { setMessage(errorMessage(e)); }
  }

  async function pick(order) {
    const p = products.find(x => x.id === order.items?.[0]?.product_id);
    if (!p) {
      try { const r = await api.get(`/orders/${order.id}`); const item = r.data.items?.[0]; const prod = products.find(x=>x.id===item?.product_id); if(prod) await api.post(`/orders/${order.id}/pick`, {barcode:prod.barcode, quantity:1}); } catch(e){ setMessage(errorMessage(e)); }
    } else {
      try { await api.post(`/orders/${order.id}/pick`, { barcode:p.barcode, quantity:1 }); } catch(e){ setMessage(errorMessage(e)); }
    }
    load();
  }

  return (
    <>
      <PageHead eyebrow="FULFILMENT" title="Orders" text="Create, prepare and monitor customer orders." />
      <div className="section-grid">
        {(user.role === "ADMIN" || user.role === "WAREHOUSE") && <div className="form-panel">
          <div className="eyebrow">NEW ORDER</div><h3>Create order</h3>
          <form onSubmit={create}>
            <Field label="Customer"><input required value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} /></Field>
            <Field label="Phone"><input value={form.customerPhone} onChange={e=>setForm({...form,customerPhone:e.target.value})} /></Field>
            <Field label="Address"><input required value={form.customerAddress} onChange={e=>setForm({...form,customerAddress:e.target.value})} /></Field>
            <div className="form-grid"><Field label="Product"><select required value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})}><option value="">Choose...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Quantity"><input type="number" min="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></Field></div>
            <button className="primary">Create order</button>
          </form>
          {message && <div className="success-text">{message}</div>}
        </div>}
        <div className="data-panel">
          <div className="table-toolbar"><div><div className="eyebrow">ORDER QUEUE</div><h3>{orders.length} orders</h3></div></div>
          <Table headers={["Order", "Customer", "Status", "Created", "Action"]} rows={orders.map(o => [<b>{o.order_number}</b>, o.customer_name, <span className={`tag ${String(o.status).toLowerCase().replaceAll("_","-")}`}>{o.status}</span>, new Date(o.created_at).toLocaleDateString(), o.status === "PENDING" ? <button className="text-btn" onClick={()=>pick(o)}>Pick first item</button> : "—"])} />
        </div>
      </div>
    </>
  );
}

function Delivery() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    try { setOrders((await api.get("/delivery/orders")).data); } catch(e) { setMessage(errorMessage(e)); }
  }
  useEffect(() => { load(); }, []);

  async function start(id) { try { await api.post(`/delivery/orders/${id}/start`); load(); } catch(e){setMessage(errorMessage(e));} }
  async function complete(id) { try { await api.post(`/delivery/orders/${id}/complete`); load(); } catch(e){setMessage(errorMessage(e));} }

  return (
    <>
      <PageHead eyebrow="LAST MILE" title="Delivery" text="Manage ready orders and delivery status." />
      {message && <div className="error">{message}</div>}
      <div className="delivery-list">
        {orders.length === 0 ? <Empty text="No ready deliveries right now." /> : orders.map(o => (
          <div className="delivery-card" key={o.id}>
            <div className="delivery-info"><div className="delivery-number">{o.order_number}</div><h3>{o.customer_name}</h3><p>{o.customer_address}</p><span className={`tag ${String(o.status).toLowerCase().replaceAll("_","-")}`}>{o.status}</span></div>
            <div className="delivery-info"><small>PHONE</small><b>{o.customer_phone || "—"}</b></div>
            <div>{o.status === "READY" && <button className="primary" onClick={()=>start(o.id)}>Start delivery</button>}{o.status === "OUT_FOR_DELIVERY" && <button className="primary" onClick={()=>complete(o.id)}>Mark delivered</button>}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PageHead({ eyebrow, title, text }) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div><div className="date-chip">● System online</div></div>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Table({ headers, rows }) {
  if (!rows.length) return <Empty text="No records found." />;
  return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Empty({ text }) { return <div className="empty">{text}</div>; }

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (saved && token) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  if (!user) return <Login onLogin={setUser} />;

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  const pages = {
    dashboard: <Dashboard user={user} go={setPage} />,
    products: <Products user={user} />,
    inventory: <Inventory />,
    warehouse: <Warehouse />,
    orders: <Orders user={user} />,
    delivery: <Delivery />
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-top"><div className="logo-row"><div className="brand-mark small">S</div><div><strong>SmartStock</strong><small>INVENTORY OS</small></div></div><button className="close-mobile" onClick={()=>setMobile(false)}>×</button></div>
        <div className="workspace"><span className="live-dot"></span>Workspace · Production</div>
        <div className="nav-label">OPERATIONS</div>
        <nav>{navItems.map(([id,icon,label])=><button key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setMobile(false)}}><span className="nav-icon">{icon}</span>{label}</button>)}</nav>
        <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div><div><b>{user.name}</b><small>{user.role}</small></div></div><button className="logout" onClick={logout}>↪ Sign out</button></div>
      </aside>

      {mobile && <div className={`sidebar-overlay ${mobile ? "show" : ""}`} onClick={()=>setMobile(false)}></div>}

      <main className="main-shell">
        <header className="topbar"><button className="menu-btn" onClick={()=>setMobile(true)}>☰</button><div className="crumb"><strong>SmartStock</strong><b>/</b><span>{navItems.find(x=>x[0]===page)?.[2]}</span></div><div className="top-actions"><span className="status-pill"><span className="live-dot"></span>All systems operational</span><div className="top-user"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div>{user.name}</div></div></header>
        <section className="content">{pages[page]}</section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
