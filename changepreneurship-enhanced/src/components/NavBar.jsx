import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex gap-2">
      <Button variant="outline" onClick={() => navigate(-1)}>
        Back
      </Button>
      <Button variant="outline" onClick={() => navigate("/")}>
        Home
      </Button>
    </div>
  );
};

export default NavBar;
