import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Box, Button, Typography, Sheet } from "@mui/joy";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const ExcelUpload = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");
  const [courts, setCourts] = useState([]);
  const token = localStorage.getItem("token");

  // مثال بيانات نموذج الإكسل لتحميله
  const exampleData = [
    {
      incoming_document_number: "123",
      incoming_date: "2025-06-01",
      court_name: "المحكمة أ",
      case_number: "456",
      camp: "مخيم 1",
      land_plot: "12",
      basin_number: "3",
      plaintiff_name: "أحمد علي",
      national_id: "9876543210",
      statement: "بيان 1",
      outgoing_document_number: "789",
      outgoing_document_date: "2025-06-10",
    },
    {
      incoming_document_number: "124",
      incoming_date: "2025-06-02",
      court_name: "المحكمة ب",
      case_number: "457",
      camp: "مخيم 2",
      land_plot: "15",
      basin_number: "4",
      plaintiff_name: "سارة محمد",
      national_id: "1234567890",
      statement: "بيان 2",
      outgoing_document_number: "790",
      outgoing_document_date: "2025-06-11",
    },
  ];

  useEffect(() => {
    // جلب المحاكم من السيرفر عند تحميل الكومبوننت
      const fetchCourts = async () => {
        try {
          const res = await axios.get("https://dpa-5xfw.onrender.com/courts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCourts(res.data.courts || res.data.court || []);
        } catch (error) {
          console.error("Failed to fetch courts:", error);
          setCourts([]);
        }
      };
      fetchCourts();
    }, [token]);

  // دالة لتحميل نموذج الإكسل
  const downloadExampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نماذج");
    XLSX.writeFile(wb, "نموذج_بيانات_المستندات_القانونية.xlsx");
  };

  // دالة تحميل ملف الإكسل وقراءة البيانات
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (jsonData.length === 0) {
        setError("الملف فارغ أو التنسيق غير صحيح.");
        setData([]);
        setColumns([]);
        return;
      }

      setColumns(Object.keys(jsonData[0]));
      setData(jsonData);
      setError("");
    };

    reader.readAsBinaryString(file);
  };

  // دالة إرسال البيانات للسيرفر
  const handleSubmit = async () => {
    if (data.length === 0) {
      setError("لا توجد بيانات للإرسال.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        "https://dpa-5xfw.onrender.com/legal_documents/bulk_upload",
        { documents: data },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setModalType("success");
      setModalMessage("تم رفع البيانات بنجاح!");
      setModalOpen(true);
      setData([]);
      setColumns([]);
    } catch (err) {
      console.error(err);
      setModalType("error");
      setModalMessage("حدث خطأ أثناء رفع البيانات.");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 3 }}>
      <Typography level="h4" mb={2} textAlign="center">
        رفع بيانات من ملف إكسل
      </Typography>

      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Button variant="outlined" onClick={downloadExampleExcel}>
          تحميل نموذج ملف إكسل
        </Button>
      </Box>

      {/* عرض أسماء المحاكم الموجودة في قاعدة البيانات */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 1,
          maxHeight: 150,
          overflowY: "auto",
          textAlign: "right",
        }}
      >
        <Typography fontWeight="bold" mb={1}>
          المحاكم المتوفرة في قاعدة البيانات:
        </Typography>
        {courts.length === 0 ? (
          <Typography color="text.secondary">جاري تحميل قائمة المحاكم...</Typography>
        ) : (
          <ul style={{ paddingRight: 15, margin: 0 }}>
            {courts.map((court) => (
              <li key={court.id}>{court.name}</li>
            ))}
          </ul>
        )}
      </Box>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ marginBottom: 20 }}
      />

      {error && (
        <Typography color="danger" mb={2}>
          {error}
        </Typography>
      )}

      {data.length > 0 && (
        <>
          <Box sx={{ overflowX: "auto", maxHeight: 400, mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: "bold" }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Button
            variant="solid"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "جارٍ الرفع..." : "رفع البيانات"}
          </Button>
        </>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>{modalType === "success" ? "نجاح" : "خطأ"}</DialogTitle>
        <DialogContent>
          <Typography>{modalMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Sheet>
  );
};

export default ExcelUpload;
  