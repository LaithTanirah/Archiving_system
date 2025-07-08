import React, { useEffect, useState } from "react";
import {
  Sheet,
  Typography,
  CircularProgress,
  Input,
  Box,
  IconButton,
} from "@mui/joy";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
  Avatar,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import { Edit, Delete, Person } from "@mui/icons-material";
import axios from "axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("https://dpa-5xfw.onrender.com/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const allUsers = res.data.users || [];
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error("فشل تحميل المستخدمين:", error);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [token]);

  // فلترة المستخدمين حسب البحث
  useEffect(() => {
    const results = users.filter((user) => {
      const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
      return (
        fullName.includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFilteredUsers(results);
  }, [search, users]);

  const handleEdit = (id) => {
    console.log("تعديل المستخدم:", id);
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await axios.delete(`https://dpa-5xfw.onrender.com/users/${userToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== userToDelete));
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("حدث خطأ أثناء حذف المستخدم:", error);
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <Sheet sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Sheet>
    );
  }

  return (
    <>
      <Sheet
        sx={{
          maxWidth: 950,
          mx: "auto",
          mt: 6,
          p: 4,
          borderRadius: "12px",
          backgroundColor: "#f9f9f9",
          boxShadow: "lg",
        }}
      >
        <Typography level="h3" mb={3} textAlign="center" fontWeight="bold">
          قائمة المستخدمين
        </Typography>

        <Input
          placeholder="ابحث عن مستخدم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3, width: "100%" }}
        />

        <TableContainer component={Paper} elevation={2}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1976d2" }}>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>#</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>الاسم الكامل</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>البريد الإلكتروني</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user, idx) => (
                <TableRow
                  key={user.id || idx}
                  sx={{
                    backgroundColor: idx % 2 === 0 ? "#fafafa" : "#f0f0f0",
                    "&:hover": { backgroundColor: "#e0e0e0" },
                  }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {user.firstname + " " + user.lastname}
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(user.id)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(user.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Sheet>

      {/* Dialog for Delete Confirmation */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          هل أنت متأكد أنك تريد حذف هذا المستخدم؟
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>إلغاء</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={deleting}
          >
            {deleting ? "جاري الحذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserList;
