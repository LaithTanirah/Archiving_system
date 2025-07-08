import React, { useEffect, useState } from "react";
import {
  Sheet,
  Typography,
  Stack,
  Box,
  Divider,
  Button,
  Modal,
  IconButton,
  CircularProgress,
} from "@mui/joy";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toISOString().split("T")[0];
};

const LegalDocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const token = localStorage.getItem("token");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultError, setResultError] = useState(false);

  useEffect(() => {
    axios
      .get(`https://dpa-5xfw.onrender.com/legal_documents/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDocument(res.data.legal_document);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching document:", err);
        setLoading(false);
      });
  }, [id, token]);

  const handleUpdateDocument = () => {
    navigate(`/dashboard/legal_documents/edit/${id}`);
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    axios
      .put(`https://dpa-5xfw.onrender.com/legal_documents/delete/${id}`, null, {
        headers: { authorization: `Bearer ${token}` },
      })
      .then(() => {
        setResultMessage("تم حذف المستند بنجاح");
        setResultError(false);
        setResultOpen(true);
      })
      .catch((err) => {
        setResultMessage("حدث خطأ أثناء الحذف، حاول مرة أخرى");
        setResultError(true);
        setResultOpen(true);
        console.error(err.response?.data || err.message);
      });
  };

  const handleCloseResult = () => {
    setResultOpen(false);
    if (!resultError) {
      navigate("/dashboard/legal_documents");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const openPdfPreview = (pdfFile) => {
    setSelectedPdf(pdfFile);
    setPdfPreviewOpen(true);
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setSelectedPdf(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return (
      <Typography level="h4" textAlign="center" mt={5}>
        لم يتم العثور على المستند.
      </Typography>
    );
  }

  return (
    <>
      <style>{`
        .print-header {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 30px;
            font-size: 16px;
            line-height: 1.8;
            color: #000;
            background: #fff;
            font-family: "Arial", sans-serif;
          }

          .print-header {
            display: block;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid black;
            padding-bottom: 10px;
          }

          .print-header h1 {
            margin: 0;
            font-size: 22px;
          }

          .print-header h2 {
            margin: 5px 0 0;
            font-size: 18px;
            font-weight: normal;
          }

          .print-section {
            margin-bottom: 20px;
          }

          .print-section .label {
            font-weight: bold;
            display: block;
            margin-bottom: 4px;
            color: #222;
          }

          .print-section .value {
            margin-left: 10px;
            color: #444;
          }

          .no-print {
            display: none !important;
          }

          .pdf-section {
            display: none !important;
          }
        }
      `}</style>

      <Sheet
        id="printable-area"
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 5,
          p: 4,
          borderRadius: "md",
          boxShadow: "lg",
          bgcolor: "background.body",
          color: "text.primary",
        }}
      >
        {/* ✅ الترويسة (تظهر فقط عند الطباعة) */}
        <Box className="print-header">
          <h1>دائرة الشؤون الفلسطينية</h1>
          <h2>مديرية الشؤون القانونية</h2>
        </Box>

        <Typography level="h3" textAlign="center" mb={3}>
          تفاصيل المستند القانوني
        </Typography>

        <Stack spacing={2}>
          {[
            ["رقم الكتاب", document.incoming_document_number],
            ["تاريخ الكتاب", document.incoming_date],
            ["اسم المحكمة", document.court_name],
            ["رقم القضية", document.case_number],
            ["المخيم", document.camp],
            ["رقم قطعة الأرض", document.land_plot],
            ["رقم الحوض", document.basin_number],
            ["البيان", document.statement],
            ["رقم المستند الصادر", document.outgoing_document_number],
            ["تاريخ المستند الصادر", document.outgoing_document_date],
          ].map(([label, value]) => (
            <Box key={label} className="print-section">
              <span className="label">{label}:</span>
              <span className="value">
                {["تاريخ", "date"].some((k) => label.includes(k))
                  ? formatDate(value)
                  : value || "—"}
              </span>
              <Divider sx={{ my: 1 }} />
            </Box>
          ))}

          {/* عرض المدعين */}
          {document.plaintiffs?.length > 0 && (
            <Box className="print-section">
              <span className="label">المدعين:</span>
              {document.plaintiffs.map((plaintiff, index) => (
                <Box key={index} sx={{ ml: 2, mt: 1 }}>
                  <span className="label">الاسم:</span>
                  <span className="value">{plaintiff.plaintiff_name || "—"}</span>
                  <br />
                  <span className="label">الرقم الوطني:</span>
                  <span className="value">{plaintiff.national_id || "—"}</span>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </Box>
          )}

          {/* ملفات PDF */}
          <Box mt={3} className="pdf-section">
            <Typography fontWeight="bold" mb={1}>
              ملفات PDF ({document.images?.length || 0})
            </Typography>
            <Stack direction="column" spacing={1}>
              {(document.images || []).map((pdfFile, index) => (
                <Box
                  key={index}
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    p: 1,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                  onClick={() => openPdfPreview(pdfFile)}
                >
                  <Typography
                    color="primary.main"
                    sx={{ textDecoration: "underline" }}
                  >
                    ملف PDF رقم {index + 1}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            mt={4}
            justifyContent="center"
            className="no-print"
            sx={{ flexWrap: "wrap", gap: 2 }}
          >
            <Button color="primary" onClick={handleUpdateDocument}>
              تحديث المستند
            </Button>
            <Button color="danger" onClick={handleDeleteClick}>
              حذف المستند
            </Button>
            <Button color="neutral" variant="outlined" onClick={handlePrint}>
              طباعة المستند
            </Button>
          </Stack>
        </Stack>
      </Sheet>

      {/* مودالات المعاينة والتأكيد والنتيجة */}
      <Modal open={pdfPreviewOpen} onClose={closePdfPreview} className="no-print">
        <Sheet
          variant="outlined"
          sx={{
            width: "90vw",
            height: "90vh",
            p: 2,
            borderRadius: "md",
            boxShadow: "lg",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <IconButton
            onClick={closePdfPreview}
            size="sm"
            sx={{ position: "absolute", top: 8, right: 8 }}
            aria-label="إغلاق المعاينة"
          >
            <CloseIcon />
          </IconButton>
          {selectedPdf ? (
            <embed
              src={`https://dpa-5xfw.onrender.com/${selectedPdf}`}
              type="application/pdf"
              width="100%"
              height="100%"
            />
          ) : (
            <Typography>لا يوجد ملف للعرض.</Typography>
          )}
        </Sheet>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} className="no-print">
        <Sheet sx={{ maxWidth: 400, p: 3, borderRadius: "md", textAlign: "center" }}>
          <Typography level="h6" mb={2}>هل أنت متأكد من حذف هذا المستند؟</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" color="neutral" onClick={() => setConfirmOpen(false)}>إلغاء</Button>
            <Button color="danger" onClick={handleConfirmDelete}>حذف</Button>
          </Stack>
        </Sheet>
      </Modal>

      <Modal open={resultOpen} onClose={handleCloseResult} className="no-print">
        <Sheet sx={{ maxWidth: 400, p: 3, borderRadius: "md", textAlign: "center" }}>
          <Typography level="h6" mb={2} color={resultError ? "danger" : "success"}>
            {resultError ? "خطأ" : "نجاح"}
          </Typography>
          <Typography mb={3}>{resultMessage}</Typography>
          <Button onClick={handleCloseResult}>حسناً</Button>
        </Sheet>
      </Modal>
    </>
  );
};

export default LegalDocumentDetails;
