// src/components/AdminLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar /> {/* Sidebar الأدمن */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet /> {/* صفحات الأدمن مثل Register, Users */}
      </div>
    </div>
  );
};

export default AdminLayout;
