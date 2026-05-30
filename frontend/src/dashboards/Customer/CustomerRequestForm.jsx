import React, { useContext, useState } from "react";
import { RequestContext } from "../../context/RequestContext";

export default function CustomerRequestForm() {
  const { addRequest } = useContext(RequestContext);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle: "",
    issue: "",
    lat: "",
    lng: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addRequest(form);
    alert("Request Sent Successfully!");
  };

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm({
        ...form,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  return (
    <div className="form-box">
      <h3>Create Breakdown Request</h3>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="Phone Number"
          required
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <input
          type="text"
          placeholder="Vehicle (Car/Bike/etc)"
          required
          onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
        />

        <textarea
          placeholder="Describe the issue"
          required
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
        ></textarea>

        <button type="button" onClick={handleLocation}>
          📍 Get My Location
        </button>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}