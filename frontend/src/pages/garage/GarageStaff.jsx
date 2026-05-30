import React, { useEffect, useState } from "react";
import api from "../../config/api";
import "../../dashboards/Garage/GarageDashboard.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  age: "",
};

export default function GarageStaff() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await api.get("/api/staff?all=true");
      setStaff(res.data);
    } catch {
      setStaff([]);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        age: form.age ? Number(form.age) : undefined,
      };
      if (editId) {
        if (form.password) payload.password = form.password;
        await api.put(`/api/staff/${editId}`, payload);
        setMessage("✓ Staff updated.");
      } else {
        await api.post("/api/staff", { ...payload, password: form.password });
        setMessage("✓ Staff added.");
      }
      setForm(emptyForm);
      setEditId(null);
      loadStaff();
    } catch (err) {
      setMessage(err.response?.data?.msg || "Action failed.");
    }
    setLoading(false);
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone || "",
      address: s.address || "",
      age: s.age != null ? String(s.age) : "",
      password: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeStaff = async (id) => {
    if (!window.confirm("Remove this staff member? They cannot log in after this.")) return;
    try {
      await api.delete(`/api/staff/${id}`);
      setMessage("✓ Staff removed.");
      loadStaff();
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not remove.");
    }
  };

  return (
    <div className="garage-page">
      <header className="page-head">
        <p className="eyebrow">Team</p>
        <h1>Manage staff</h1>
        <p className="hero-copy">
          Add mechanic details, then assign them from Requests. Staff log in at the portal below.
        </p>
      </header>

      <div className="premium-card staff-portal-card">
        <h3>Mechanic login portal</h3>
        <p className="panel-sub">
          Staff sign in on your website — no need to save a special link every time:
        </p>
        <ol className="staff-portal-steps">
          <li>Go to your Connex site → <strong>Sign in</strong></li>
          <li>Tap <strong>Field mechanic → Staff sign-in</strong> (or open /staff/login)</li>
          <li>Use the <strong>email + password</strong> you set below</li>
        </ol>
        <code className="staff-portal-url">
          {typeof window !== "undefined" ? `${window.location.origin}/staff/login` : "/staff/login"}
        </code>
        <a href="/staff/login" target="_blank" rel="noreferrer" className="btn-secondary">
          Open staff sign-in page
        </a>
      </div>

      <div className="staff-grid">
        <form className="premium-card staff-form-card" onSubmit={handleSubmit}>
          <h2>{editId ? "Edit staff" : "Add staff"}</h2>
          <div className="form-field">
            <label>Staff name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              required
            />
          </div>
          <div className="form-field">
            <label>Home address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Area, city"
              required
            />
          </div>
          <div className="form-field">
            <label>Phone number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit mobile"
              required
            />
          </div>
          <div className="form-field">
            <label>Age</label>
            <input
              type="number"
              min="18"
              max="80"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="e.g. 28"
              required
            />
          </div>
          <div className="form-field">
            <label>Login email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label>{editId ? "New password (optional)" : "Login password"}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editId}
            />
          </div>
          {message && <p className={message.includes("✓") ? "toast-success" : "form-error"}>{message}</p>}
          <div className="staff-form-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {editId ? "Save changes" : "Add staff"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="premium-card">
          <h2>Team ({staff.filter((s) => s.isActive !== false).length})</h2>
          {staff.length === 0 ? (
            <p className="panel-sub">No staff yet.</p>
          ) : (
            <ul className="staff-roster">
              {staff.map((s) => (
                <li key={s._id} className={s.isActive === false ? "inactive" : ""}>
                  <div className="staff-roster-details">
                    <strong>{s.name}</strong>
                    {s.age != null && <span className="staff-meta-pill">{s.age} yrs</span>}
                    <p className="panel-sub">{s.phone || "—"}</p>
                    <p className="panel-sub">{s.address || "No address"}</p>
                    <p className="panel-sub staff-email">{s.email}</p>
                  </div>
                  <div className="staff-roster-actions">
                    <button type="button" className="btn-secondary" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    {s.isActive !== false && (
                      <button
                        type="button"
                        className="btn-secondary danger-outline"
                        onClick={() => removeStaff(s._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
