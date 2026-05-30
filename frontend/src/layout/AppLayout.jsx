import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AiAssistant from "../components/common/AiAssistant";
import "./AppLayout.css";

const AUTH_PATHS = ["/login", "/staff/login", "/login/staff", "/signup/customer", "/signup/mechanic", "/"];

export default function AppLayout() {
  const { pathname } = useLocation();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    return <Outlet />;
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <AiAssistant />
    </div>
  );
}
