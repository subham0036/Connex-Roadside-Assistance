import React, { useState, useEffect } from "react";
import AssignMechanic from "./AssignMechanic";
import RequestChat from "../chat/RequestChat";
import JobStatusTimeline from "../jobs/JobStatusTimeline";
import PaymentSummary from "../jobs/PaymentSummary";
import { GarageRequestActions } from "../jobs/RequestActions";
import { requestTotalPaid } from "../../utils/requestPayments";
import "../jobs/RequestActions.css";

const STATUS_LABEL = {
  pending: "Awaiting assignment",
  assigned: "Staff assigned",
  en_route: "En route",
  arrived: "At location",
  completed: "Done",
  cancelled: "Cancelled",
};

export default function RequestDetailsModal({
  request: initialRequest,
  staff,
  onClose,
  onUpdated,
  initialTab = "details",
  videoAutoStart = false,
  onTabChange,
}) {
  const [tab, setTab] = useState(initialTab);
  const [request, setRequest] = useState(initialRequest);

  const refreshRequest = (updated) => {
    if (updated) setRequest(updated);
    onUpdated?.(updated);
  };

  useEffect(() => {
    setRequest(initialRequest);
  }, [initialRequest]);

  const selectTab = (next) => {
    setTab(next);
    onTabChange?.(next);
  };
  const loc = request.requestLocation || {};

  return (
    <div className="modal-container">
      <div className={`modal-box ${tab === "chat" ? "modal-chat" : "modal-wide"}`}>
        <button type="button" className="close-btn" onClick={onClose}>×</button>
        <div className="modal-tabs">
          <button type="button" className={tab === "details" ? "active" : ""} onClick={() => selectTab("details")}>Details</button>
          <button type="button" className={tab === "chat" ? "active" : ""} onClick={() => selectTab("chat")}>Chat & video</button>
          {request.status === "pending" && request.garageAccepted && (
            <button type="button" className={tab === "assign" ? "active" : ""} onClick={() => selectTab("assign")}>Assign staff</button>
          )}
        </div>

        {tab === "details" && (
          <>
            <h2>{request.issue}</h2>
            <JobStatusTimeline status={request.status} compact />
            <PaymentSummary request={request} highlight />

            <GarageRequestActions request={request} onUpdated={refreshRequest} />

            {request.status === "pending" && request.garageAccepted && (
              <p className="panel-sub" style={{ marginTop: 12 }}>
                Request accepted — go to <strong>Assign staff</strong> to send a mechanic.
              </p>
            )}

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
          <RequestChat
            requestId={String(request._id)}
            title="Customer chat"
            videoAutoStart={videoAutoStart}
          />
        )}

        {tab === "assign" && request.garageAccepted && (
          <AssignMechanic request={request} staff={staff} closeAssignment={() => selectTab("details")} onAssigned={refreshRequest} />
        )}

        {tab === "assign" && !request.garageAccepted && (
          <p className="form-error">Accept the request first before assigning staff.</p>
        )}
      </div>
    </div>
  );
}
