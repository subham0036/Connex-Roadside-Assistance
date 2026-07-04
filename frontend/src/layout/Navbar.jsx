import { useState } from "react";
import ConnexLogo from "../components/brand/ConnexLogo";
import ProfilePanel from "../components/profile/ProfilePanel";
import "../style/Navbar.css";

function initials(name = "") {
  const p = name.trim().split(" ");

  if (p.length >= 2)
    return (p[0][0] + p[1][0]).toUpperCase();

  return name.slice(0,2).toUpperCase() || "?";
}

export default function Navbar(){

  const role=localStorage.getItem("connex_role");

  const user=JSON.parse(localStorage.getItem("connex_user")||"{}");

  const [open,setOpen]=useState(false);

  return(

<>

<header className="navbar">

<ConnexLogo size={36} className="connex-logo--navbar"/>

<div className="nav-actions">

<span className="nav-tag">

24×7 Roadside Assistance

</span>

<button

className="nav-avatar"

onClick={()=>setOpen(true)}

>

<span className="nav-avatar-circle">

{initials(user.name)}

</span>

<span className="nav-avatar-name">

{user.name||"Profile"}

</span>

</button>

<span className="nav-role-badge">

{role}

</span>

</div>

</header>

<ProfilePanel

open={open}

onClose={()=>setOpen(false)}

/>

</>

);

}