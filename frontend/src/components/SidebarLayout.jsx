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
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Search, AddCircle, Folder, Logout } from "@mui/icons-material";

// Safe token parsing
let payload = {};
try {
  const token = localStorage.getItem("token");
  if (token) {
    const base64Payload = token.split(".")[1];
    payload = JSON.parse(atob(base64Payload));
  } else {
    console.warn("Token not found");
  }
} catch (error) {
  console.error("Failed to decode token:", error.message);
}

const SidebarLayout = () => {
  const navigate = useNavigate();

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
          width: 320,
          p: 3,
          backgroundColor: "background.surface",
          borderRight: "1px solid",
          borderColor: "divider",
          boxShadow: "sm",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar size="sm" />
          <Typography level="h4">
            {payload?.firstname || "User"} {payload?.lastname || ""}
          </Typography>
        </Box>

        {/* Menu Items */}
        <List size="lg" sx={{ gap: 1, flexGrow: 1 }}>
          <ListItem>
            <ListItemButton component={Link} to="caseform">
              <ListItemDecorator>
                <AddCircle />
              </ListItemDecorator>
              إضافة مستند
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton component={Link} to="legal_documents">
              <ListItemDecorator>
                <Folder />
              </ListItemDecorator>
              عرض المستندات
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton component={Link} to="search?q=">
              <ListItemDecorator>
                <Search />
              </ListItemDecorator>
              البحث في المستندات
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton component={Link} to="bulk_upload">
              <ListItemDecorator>
                {/* ممكن تستخدم أيقونة مناسبة مثل Upload أو InsertDriveFile */}
                <AddCircle />
              </ListItemDecorator>
              رفع بيانات من إكسل
            </ListItemButton>
          </ListItem>
        </List>

        {/* Logout Button */}
        <ListItem sx={{ mt: "auto" }}>
          <ListItemButton onClick={handleLogout}>
            <ListItemDecorator>
              <Logout />
            </ListItemDecorator>
            تسجيل الخروج
          </ListItemButton>
        </ListItem>
      </Sheet>

      {/* Main Content Area */}
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

export default SidebarLayout;
