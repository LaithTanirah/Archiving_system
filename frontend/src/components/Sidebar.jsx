import React from "react";
import {
  Box,
  Sheet,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
  Avatar,
} from "@mui/joy";
import {
  PersonAdd,
  People,
  Logout,
  Folder, // ✅ تمت الإضافة
} from "@mui/icons-material";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

// Safe token parsing
let payload = {};
try {
  const token = localStorage.getItem("token");
  if (token) {
    const base64Payload = token.split(".")[1];
    payload = JSON.parse(atob(base64Payload));
  }
} catch (error) {
  console.error("Invalid token format:", error.message);
}

const AdminSidebarLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: "background.body",
        direction: "rtl",
        textAlign: "right",
      }}
    >
      {/* Sidebar */}
      <Sheet
        sx={{
          width: 300,
          p: 3,
          backgroundColor: "background.surface",
          borderRight: "1px solid",
          borderColor: "divider",
          boxShadow: "sm",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar size="sm" />
          <Typography level="h4">
            {payload?.firstname || "مسؤول"} {payload?.lastname || ""}
          </Typography>
        </Box>

        <List size="lg" sx={{ gap: 1, flexGrow: 1 }}>
          <ListItem>
            <ListItemButton
              component={Link}
              to="/admin/register"
              selected={location.pathname === "/admin/register"}
            >
              <ListItemDecorator>
                <PersonAdd />
              </ListItemDecorator>
              تسجيل مستخدم
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton
              component={Link}
              to="/admin/users"
              selected={location.pathname === "/admin/users"}
            >
              <ListItemDecorator>
                <People />
              </ListItemDecorator>
              جميع المستخدمين
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton
              component={Link}
              to="/admin/courts"
              selected={location.pathname === "/admin/courts"}
            >
              <ListItemDecorator>
                <Folder />
              </ListItemDecorator>
              إدارة المحاكم
            </ListItemButton>
          </ListItem>
        </List>

        <ListItem sx={{ mt: "auto" }}>
          <ListItemButton onClick={handleLogout}>
            <ListItemDecorator>
              <Logout />
            </ListItemDecorator>
            تسجيل الخروج
          </ListItemButton>
        </ListItem>
      </Sheet>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          p: 4,
          overflowY: "auto",
          backgroundColor: "background.level1",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminSidebarLayout;
