import React, { useState } from "react";

export default function CustomerRequestForm({ onSubmit, location, disabled, previewOnly }) {
  const [problem, setProblem] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ issue: problem, vehicleType: vehicle, phone, note, location });
  };

  return (
    <div className="customer-form-container">
      <div className="form-header">
        <span className="eyebrow">Breakdown details</span>
        <h2>{previewOnly ? "Describe your problem" : "Confirm & send request"}</h2>
      </div>

      <form className="glass-form" onSubmit={handleSubmit}>
        <label>What happened?</label>
        <select value={problem} onChange={(e) => setProblem(e.target.value)} required disabled={disabled}>
          <option value="">Select issue</option>
          <option value="Flat Tyre">Flat Tyre</option>
          <option value="Engine Failure">Engine Failure</option>
          <option value="Car Not Starting">Car Not Starting</option>
          <option value="Battery Jump Start">Battery Jump Start</option>
          <option value="Fuel Empty">Fuel Empty</option>
          <option value="Other">Other</option>
        </select>

        <label>Vehicle type</label>
        <input
          type="text"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          placeholder="Car, bike, truck..."
          required
          disabled={disabled}
        />

        <label>Contact number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          required
          disabled={disabled}
        />

        <label>Extra notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Highway km marker, lane, vehicle color..."
          disabled={disabled}
        />

        {!previewOnly && (
          <button className="btn-primary" type="submit" disabled={disabled}>
            Send request to garage
          </button>
        )}
      </form>
    </div>
  );
}
