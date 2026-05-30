import { createContext, useState } from "react";

export const RequestContext = createContext();

export default function RequestProvider({ children }) {
  const [requests, setRequests] = useState([]);

  // Customer creates request
  const addRequest = (newReq) => {
    setRequests((prev) => [...prev, { ...newReq, id: Date.now(), status: "pending", mechanic: null }]);
  };

  // Staff assigns mechanic
  const assignMechanic = (reqId, mechName) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, mechanic: mechName, status: "assigned" } : r
      )
    );
  };

  return (
    <RequestContext.Provider value={{ requests, addRequest, assignMechanic }}>
      {children}
    </RequestContext.Provider>
  );
}