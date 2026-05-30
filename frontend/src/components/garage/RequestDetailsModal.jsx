import React, { useState } from "react";
import AssignMechanic from "./AssignMechanic";
import RequestChat from "../chat/RequestChat";
import JobStatusTimeline from "../jobs/JobStatusTimeline";
import PaymentSummary from "../jobs/PaymentSummary";
import { requestTotalPaid } from "../../utils/requestPayments";

const STATUS_LABEL = {
  pending: "Awaiting assignment",
  assigned: "Staff assigned",
  en_route: "En route",
  arrived: "At location",
  completed: "Done",
  cancelled: "Cancelled",
};

export default function RequestDetailsModal({ request, staff, onClose, onUpdated }) {
  const [tab, setTab] = useState("details");
  const loc = request.requestLocation || {};

  return (
    <div className="modal-container">
      <div className={`modal-box ${tab === "chat" ? "modal-chat" : "modal-wide"}`}>
        <button type="button" className="close-btn" onClick={onClose}>×</button>
        <div className="modal-tabs">
          <button type="button" className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>Details</button>
          <button type="button" className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>Chat & video</button>
          {request.status === "pending" && (
            <button type="button" className={tab === "assign" ? "active" : ""} onClick={() => setTab("assign")}>Assign staff</button>
          )}
        </div>

        {tab === "details" && (
          <>
            <h2>{request.issue}</h2>
            <JobStatusTimeline status={request.status} compact />
            <PaymentSummary request={request} highlight />
            <div className="modal-details">
              <p><strong>Customer:</strong> {request.customerName || request.customerId?.name}</p>
              <p><strong>Phone:</strong> <a href={`tel:${request.phone}`}>{request.phone}</a></p>
              <p><strong>Vehicle:</strong> {request.vehicleType}</p>
              <p><strong>Assigned staff:</strong> {request.assignedStaffName || request.staffId?.name || "—"}</p>
              <p><strong>Status:</strong> {STATUS_LABEL[request.status]}</p>
              {request.status === "completed" && (
                <p><strong>Total collected:</strong> ₹{requestTotalPaid(request)}</p>
              )}
              {loc.lat && (
                <p>
                  <strong>GPS:</strong>{" "}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer">
                    Open in Google Maps
                  </a>
                </p>
              )}
            </div>
          </>
        )}

        {tab === "chat" && (
          <RequestChat requestId={String(request._id)} title="Customer chat" />
        )}

        {tab === "assign" && (
          <AssignMechanic request={request} staff={staff} closeAssignment={() => setTab("details")} onAssigned={onUpdated} />
        )}
      </div>
    </div>
  );
}
