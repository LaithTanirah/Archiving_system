// src/components/CourtsList.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Input,
  Table,
  Sheet,
  IconButton,
  Stack,
} from "@mui/joy";
import { Delete } from "@mui/icons-material";
import axios from "axios";

const CourtsList = () => {
  const [courts, setCourts] = useState([]);
  const [newCourt, setNewCourt] = useState("");
  const token = localStorage.getItem("token");

  const fetchCourts = async () => {
    try {
      const res = await axios.get("https://dpa-5xfw.onrender.com/courts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourts(res.data.court || []);
    } catch (err) {
      console.error("فشل في جلب المحاكم:", err.message);
    }
  };

  const addCourt = async () => {
    if (!newCourt.trim()) return;
    try {
      await axios.post(
        "https://dpa-5xfw.onrender.com/courts",
        { name: newCourt },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewCourt("");
      fetchCourts();
    } catch (err) {
      console.error("فشل في إضافة المحكمة:", err.message);
    }
  };

  const deleteCourt = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف المحكمة؟")) return;
    try {
      await axios.delete(`https://dpa-5xfw.onrender.com/courts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCourts();
    } catch (err) {
      console.error("فشل في حذف المحكمة:", err.message);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
      <Typography
        level="h3"
        mb={3}
        sx={{ fontWeight: "bold", textAlign: "center", color: "primary.700" }}
      >
        إدارة المحاكم
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={4}
        alignItems="center"
        justifyContent="center"
      >
        <Input
          placeholder="اسم المحكمة"
          value={newCourt}
          onChange={(e) => setNewCourt(e.target.value)}
          sx={{ flex: 1 }}
          size="md"
          variant="outlined"
        />
        <Button
          onClick={addCourt}
          variant="solid"
          color="primary"
          sx={{ minWidth: 100 }}
        >
          إضافة
        </Button>
      </Stack>

      <Sheet
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflowX: "auto",
          boxShadow: "sm",
          bgcolor: "background.body",
        }}
      >
        <Table
          sx={{
            minWidth: 350,
            "--TableCell-headBackground": "primary.100",
            "--TableHeaderCell-hoverBackground": "primary.200",
          }}
          aria-label="قائمة المحاكم"
        >
          <thead>
            <tr>
              <th style={{ width: 70, textAlign: "center" }}>المعرف</th>
              <th style={{ minWidth: 200, textAlign: "center" }}>اسم المحكمة</th>
              <th style={{ width: 100, textAlign: "center" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {courts.length > 0 ? (
              courts.map((court) => (
                <tr key={court.id}>
                  <td style={{ textAlign: "center" }}>{court.id}</td>
                  <td style={{ textAlign: "center" }}>{court.name}</td>
                  <td style={{ textAlign: "center" }}>
                    <IconButton
                      onClick={() => deleteCourt(court.id)}
                      color="danger"
                      variant="soft"
                      aria-label="حذف المحكمة"
                    >
                      <Delete />
                    </IconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                  لا توجد محاكم للعرض
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>
    </Box>
  );
};

export default CourtsList;
