  // components/AdminRoute.js
  import React from "react";
  import { Navigate, Outlet } from "react-router-dom";

  const AdminRoute = () => {
    const userEmail = localStorage.getItem("userEmail");
    return userEmail === "admin" ? <Outlet /> : <Navigate to="/" />;
  };

  export default AdminRoute;
