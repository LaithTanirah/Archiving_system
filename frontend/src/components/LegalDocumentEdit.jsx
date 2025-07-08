import React, { useEffect, useState } from "react";
import {
  Sheet,
  Typography,
  Stack,
  Box,
  Button,
  Input,
  Textarea,
  CircularProgress,
  Modal,
  Divider,
  Select,
  Option,
} from "@mui/joy";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const camps = [
  "مخيم الحسين",
  "مخيم الوحدات",
  "مخيم الطالبية",
  "مخيم مادبا",
  "مخيم الامير حسن",
  "مخيم جرش",
  "مخيم سوف",
  "مخيم اربد",
  "مخيم الشهيد عزمي المفتي",
  "مخيم البقعة",
  "مخيم الزرقاء",
  "مخيم حطين",
  "مخيم السنخة",
];

const fieldMap = {
  incoming_document_number: "رقم الكتاب",
  incoming_date: "تاريخ الكتاب",
  court_name: "اسم المحكمة",
  case_number: "رقم القضية",
  camp: "المخيم",
  land_plot: "رقم القطعة",
  basin_number: "رقم الحوض",
  statement: "البيان",
  outgoing_document_number: "رقم الكتاب الصادر",
  outgoing_document_date: "تاريخ الكتاب الصادر",
};

const LegalDocumentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  const [originalFiles, setOriginalFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalSeverity, setModalSeverity] = useState("");

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [caseYear, setCaseYear] = useState("");
  const [caseNumber, setCaseNumber] = useState("");

  const [courts, setCourts] = useState([]);

  useEffect(() => {
    // جلب المحاكم
    const fetchCourts = async () => {
      try {
        const res = await axios.get("https://dpa-d1rm.onrender.com/courts", {
          headers: { authorization: `Bearer ${token}` },
        });
        setCourts(res.data.courts || res.data.court || []);
      } catch (error) {
        console.error("Failed to fetch courts", error);
      }
    };

    fetchCourts();
  }, [token]);

  useEffect(() => {
    axios
      .get(`https://dpa-d1rm.onrender.com/legal_documents/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const apiDoc = res.data.legal_document;

        const doc = {};
        for (const key in fieldMap) {
          if (
            ["incoming_date", "outgoing_document_date"].includes(key) &&
            apiDoc[key]
          ) {
            doc[fieldMap[key]] = new Date(apiDoc[key]).toISOString().split("T")[0];
          } else {
            doc[fieldMap[key]] = apiDoc[key] || "";
          }
        }

        doc.court_id = apiDoc.court_id || "";
        setDocument({
          ...doc,
          plaintiffs: apiDoc.plaintiffs || [],
        });

        setOriginalFiles(apiDoc.images || []); // هنا الصور سابقاً، أصبحت ملفات PDF
        setFiles(apiDoc.images || []);

        const parts = apiDoc.case_number?.split("/") || [];
        setCaseYear(Number(parts[0]) || "");
        setCaseNumber(parts[1] || "");

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setModalMessage("فشل في جلب البيانات");
        setModalSeverity("error");
        setModalOpen(true);
      });
  }, [id, token]);

  const handleChange = (name, value) => {
    setDocument((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaintiffChange = (index, field, value) => {
    const newPlaintiffs = [...(document.plaintiffs || [])];
    newPlaintiffs[index] = {
      ...newPlaintiffs[index],
      [field]: value,
    };
    setDocument((prev) => ({ ...prev, plaintiffs: newPlaintiffs }));
  };

  const handlePlaintiffRemove = (index) => {
    const newPlaintiffs = [...(document.plaintiffs || [])];
    newPlaintiffs.splice(index, 1);
    setDocument((prev) => ({ ...prev, plaintiffs: newPlaintiffs }));
  };

  const handleAddPlaintiff = () => {
    setDocument((prev) => ({
      ...prev,
      plaintiffs: [...(prev.plaintiffs || []), { plaintiff_name: "", national_id: "" }],
    }));
  };

  const handleFileRemove = (file) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    if (originalFiles.includes(file)) {
      setFilesToDelete((prev) => [...prev, file]);
    }
  };

  const handleAddFiles = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFs = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...newFs]);
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenPreview = (file) => {
    // file ممكن يكون اسم ملف من السيرفر (string) أو ملف جديد (object)
    if (typeof file === "string") {
      setPreviewFile(`https://dpa-d1rm.onrender.com/${file}`);
    } else if (file.preview) {
      setPreviewFile(file.preview);
    }
    setPreviewModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      const fullCaseNumber = `${caseYear}/${caseNumber}`;
      const updatedDoc = { ...document, "رقم القضية": fullCaseNumber };

      for (const key in fieldMap) {
        const arabicLabel = fieldMap[key];
        if (key === "court_name") {
          formData.append("court_id", document.court_id || "");
        } else {
          formData.append(key, updatedDoc[arabicLabel] || "");
        }
      }

      // الملفات (PDF)
      files.forEach((f) => formData.append("images", f)); // ملفات موجودة على السيرفر - إرسال كمسارات (string)
      filesToDelete.forEach((f) => formData.append("imagesToDelete", f)); // ملفات للحذف
      newFiles.forEach((f) => formData.append("documents", f.file)); // ملفات جديدة للرفع

      // ارسال plaintiffs كمصفوفة JSON
      formData.append("plaintiffs", JSON.stringify(document.plaintiffs || []));

      await axios.put(`https://dpa-d1rm.onrender.com/legal_documents/${id}`, formData, {
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setModalMessage("تم تحديث المستند بنجاح");
      setModalSeverity("success");
      setModalOpen(true);
    } catch (err) {
      setModalMessage("حدث خطأ أثناء التحديث");
      setModalSeverity("error");
      setModalOpen(true);
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1990; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse();
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
      <Sheet
        sx={{
          maxWidth: 900,
          mx: "auto",
          mt: 5,
          p: 4,
          borderRadius: "lg",
          boxShadow: "lg",
          textAlign: "right",
        }}
      >
        <Typography
          level="h2"
          textAlign="center"
          fontWeight="lg"
          color="primary.plainColor"
          mb={3}
        >
          تعديل مستند قانوني
        </Typography>

        <Stack spacing={3}>
          {Object.values(fieldMap).map((label) => {
            if (label === "اسم المحكمة") {
              return (
                <Stack key={label} spacing={1}>
                  <Typography level="title-sm" fontWeight="lg">
                    {label}
                  </Typography>
                  <Select
                    value={document.court_id || ""}
                    onChange={(e, val) => {
                      setDocument((prev) => ({
                        ...prev,
                        court_id: val,
                        [label]: courts.find((c) => c.id === val)?.name || "",
                      }));
                    }}
                    required
                    placeholder="اختر المحكمة"
                  >
                    {courts.map((court) => (
                      <Option key={court.id} value={court.id}>
                        {court.name}
                      </Option>
                    ))}
                  </Select>
                </Stack>
              );
            }

            if (label === "البيان")
              return (
                <Stack key={label} spacing={1}>
                  <Typography level="title-sm" fontWeight="lg">
                    {label}
                  </Typography>
                  <Textarea
                    minRows={3}
                    value={document[label] || ""}
                    onChange={(e) => handleChange(label, e.target.value)}
                    required
                  />
                </Stack>
              );

            if (label === "المخيم")
              return (
                <Stack key={label} spacing={1}>
                  <Typography level="title-sm" fontWeight="lg">
                    {label}
                  </Typography>
                  <Select
                    value={document[label] || ""}
                    onChange={(e, val) => handleChange(label, val)}
                    required
                    placeholder="اختر المخيم"
                  >
                    {camps.map((camp) => (
                      <Option key={camp} value={camp}>
                        {camp}
                      </Option>
                    ))}
                  </Select>
                </Stack>
              );

            if (label === "رقم القضية")
              return (
                <Stack key={label} spacing={1} direction="row" alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography level="title-sm" fontWeight="lg">
                      السنة
                    </Typography>
                    <Select
                      value={caseYear}
                      onChange={(e, val) => setCaseYear(val)}
                      required
                      placeholder="اختر السنة"
                    >
                      {generateYears().map((year) => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ flex: 2, mr: 2 }}>
                    <Typography level="title-sm" fontWeight="lg">
                      رقم القضية
                    </Typography>
                    <Input
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      required
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </Box>
                </Stack>
              );

            if (
              label === "تاريخ الكتاب" ||
              label === "تاريخ الكتاب الصادر"
            )
              return (
                <Stack key={label} spacing={1}>
                  <Typography level="title-sm" fontWeight="lg">
                    {label}
                  </Typography>
                  <Input
                    type="date"
                    value={document[label] || ""}
                    onChange={(e) => handleChange(label, e.target.value)}
                    required
                  />
                </Stack>
              );

            return (
              <Stack key={label} spacing={1}>
                <Typography level="title-sm" fontWeight="lg">
                  {label}
                </Typography>
                <Input
                  value={document[label] || ""}
                  onChange={(e) => handleChange(label, e.target.value)}
                  required
                />
              </Stack>
            );
          })}

          {/* المدعون */}
          <Divider sx={{ my: 3 }} />
          <Typography level="title-md" fontWeight="lg" mb={1}>
            المدعون
          </Typography>

          {document.plaintiffs && document.plaintiffs.length > 0 ? (
            document.plaintiffs.map((plaintiff, index) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  position: "relative",
                  textAlign: "right",
                }}
              >
                <Input
                  label="اسم المدعي"
                  value={plaintiff.plaintiff_name || ""}
                  onChange={(e) =>
                    handlePlaintiffChange(index, "plaintiff_name", e.target.value)
                  }
                  required
                  sx={{ mb: 1 }}
                />
                <Input
                  label="الرقم الوطني"
                  value={plaintiff.national_id || ""}
                  onChange={(e) =>
                    handlePlaintiffChange(index, "national_id", e.target.value)
                  }
                  required
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                />
                <Button
                  color="danger"
                  variant="soft"
                  size="sm"
                  sx={{ position: "absolute", top: 8, left: 8 }}
                  onClick={() => handlePlaintiffRemove(index)}
                >
                  حذف
                </Button>
              </Box>
            ))
          ) : (
            <Typography>لا يوجد مدعين.</Typography>
          )}

          <Button variant="outlined" onClick={handleAddPlaintiff}>
            إضافة مدعي جديد
          </Button>

          {/* إدارة ملفات PDF */}
          <Divider sx={{ my: 3 }} />
          <Typography level="title-md" fontWeight="lg" mb={1}>
            ملفات PDF
          </Typography>

          <Stack direction="column" spacing={1}>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  p: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  component="button"
                  onClick={() => handleOpenPreview(file)}
                  sx={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "1rem",
                    color: "blue",
                  }}
                >
                  ملف PDF رقم {index + 1}
                </Typography>

                <Button
                  variant="outlined"
                  color="danger"
                  size="sm"
                  onClick={() => handleFileRemove(file)}
                >
                  حذف
                </Button>
              </Box>
            ))}

            {newFiles.map((fileObj, index) => (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  p: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  component="button"
                  onClick={() => handleOpenPreview(fileObj)}
                  sx={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "1rem",
                    color: "blue",
                  }}
                >
                  {fileObj.file.name}
                </Typography>

                <Button
                  variant="outlined"
                  color="danger"
                  size="sm"
                  onClick={() => handleRemoveNewFile(index)}
                >
                  حذف
                </Button>
              </Box>
            ))}
          </Stack>

          <Button component="label" variant="outlined" sx={{ mt: 2 }}>
            إضافة ملفات PDF
            <input
              hidden
              multiple
              type="file"
              accept="application/pdf"
              onChange={handleAddFiles}
            />
          </Button>

          <Button
            variant="solid"
            color="primary"
            sx={{ mt: 4 }}
            onClick={handleUpdate}
          >
            تحديث المستند
          </Button>
        </Stack>
      </Sheet>

      {/* مودال التنبيهات */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeOnOverlayClick>
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 400,
            mx: "auto",
            p: 3,
            borderRadius: "md",
            mt: "30vh",
            textAlign: "center",
          }}
        >
          <Typography
            level="h6"
            color={modalSeverity === "error" ? "danger" : "success"}
            mb={2}
          >
            {modalMessage}
          </Typography>
          <Button variant="soft" onClick={() => setModalOpen(false)}>
            إغلاق
          </Button>
        </Sheet>
      </Modal>

      {/* مودال معاينة ملفات PDF */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
        }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            p: 2,
            borderRadius: "md",
            overflow: "auto",
            backgroundColor: "white",
          }}
        >
          <Typography level="h6" mb={2} textAlign="center">
            معاينة ملف PDF
          </Typography>
          {previewFile ? (
            <embed
              src={previewFile}
              type="application/pdf"
              width="100%"
              height="600px"
            />
          ) : (
            <Typography>لا يوجد ملف للمعاينة</Typography>
          )}
          <Button
            variant="outlined"
            sx={{ mt: 2, display: "block", mx: "auto" }}
            onClick={() => setPreviewModalOpen(false)}
          >
            إغلاق
          </Button>
        </Sheet>
      </Modal>
    </>
  );
};

export default LegalDocumentEdit;
