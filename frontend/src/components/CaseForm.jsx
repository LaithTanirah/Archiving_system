"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Sheet,
  Typography,
  Input,
  Textarea,
  FormLabel,
  FormControl,
  Button,
  Stack,
  Modal,
  ModalClose,
  IconButton,
  DialogTitle,
  DialogActions,
  Select,
  Option,
} from "@mui/joy";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Delete from "@mui/icons-material/Delete";

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
  "رقم الكتاب": "incoming_document_number",
  "تاريخ الكتاب": "incoming_date",
  "اسم المحكمة": "court_name",
  المخيم: "camp",
  "رقم القطعة": "land_plot",
  "رقم الحوض": "basin_number",
  البيان: "statement",
  "رقم الكتاب الصادر": "outgoing_document_number",
  "تاريخ الكتاب الصادر": "outgoing_document_date",
};

const LOCAL_STORAGE_KEY = "caseFormData";

const getInitialState = () => {
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch {
        return null;
      }
    }
  }
  return null;
};

const CaseForm = () => {
  const saved = getInitialState();

  const [formData, setFormData] = useState(
    saved?.formData || {
      "رقم الكتاب": "",
      "تاريخ الكتاب": "",
      "اسم المحكمة": "",
      court_id: "",
      المخيم: "",
      "رقم القطعة": "",
      "رقم الحوض": "",
      البيان: "",
      "رقم الكتاب الصادر": "",
      "تاريخ الكتاب الصادر": "",
    }
  );

  const [plaintiffs, setPlaintiffs] = useState(
    saved?.plaintiffs || [{ plaintiff_name: "", national_id: "" }]
  );

  const [caseYear, setCaseYear] = useState(
    saved?.caseYear || new Date().getFullYear()
  );
  const [caseNumberPart, setCaseNumberPart] = useState(
    saved?.caseNumberPart || ""
  );

  const [images, setImages] = useState([]);
  const [previewURLs, setPreviewURLs] = useState(saved?.previewURLs || []);

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [errors, setErrors] = useState([]);
  const [courts, setCourts] = useState([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    const dataToSave = {
      formData,
      plaintiffs,
      caseYear,
      caseNumberPart,
      previewURLs,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, plaintiffs, caseYear, caseNumberPart, previewURLs]);

  useEffect(() => {
    const fetchCourts = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://10.128.4.113:5000/courts", {
          headers: { authorization: `Bearer ${token}` },
        });
        setCourts(res.data.court || res.data.courts || []);
      } catch (error) {
        console.error("Failed to fetch courts", error);
      }
    };
    fetchCourts();
  }, [token]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePlaintiffChange = (index, field, value) => {
    const newPlaintiffs = [...plaintiffs];
    newPlaintiffs[index][field] = value;
    setPlaintiffs(newPlaintiffs);

  };

  const addPlaintiff = () => {
    setPlaintiffs([...plaintiffs, { plaintiff_name: "", national_id: "" }]);
  };

  const removePlaintiff = (index) => {
    setPlaintiffs(plaintiffs.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...selectedFiles]);
    setPreviewURLs((prev) => [...prev, ...urls]);
  };

  const handleImageRemove = (indexToRemove) => {
    setImages(images.filter((_, i) => i !== indexToRemove));
    setPreviewURLs(previewURLs.filter((_, i) => i !== indexToRemove));
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1990; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  const validateForm = () => {
    const newErrors = [];
    Object.entries(formData)
      .filter(([key]) => key !== "court_id")
      .forEach(([key, val]) => {
        if (!val || val.trim() === "") newErrors.push(`الحقل "${key}" مطلوب`);
      });

    plaintiffs.forEach((p, idx) => {
      const name = p.plaintiff_name.trim();
      const id = p.national_id.trim();

      // إذا الحقلين فاضيين تجاهل
      if (name === "" && id === "") return;

      // إذا في رقم وطني لازم يكون 10 أرقام
      if (id !== "" && !/^\d{10}$/.test(id)) {
        newErrors.push(
          `الرقم الوطني للمدعي رقم ${idx + 1} غير صحيح يجب إدخال 10 أرقام`
        );
      }

      // إذا في رقم وطني بدون اسم → خطأ
      if (id !== "" && name === "") {
        newErrors.push(`اسم المدعي رقم ${idx + 1} مطلوب عند إدخال رقم وطني`);
      }
    });

    if (!caseNumberPart.trim()) newErrors.push("رقم القضية مطلوب");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessageType("error");
      setMessage("يرجى تصحيح الأخطاء التالية:");
      setOpen(true);
      return;
    }

    const data = new FormData();

    for (const [arKey, enKey] of Object.entries(fieldMap)) {
      if (arKey === "اسم المحكمة") {
        data.append("court_id", formData["court_id"] || "");
      } else {
        data.append(enKey, formData[arKey] || "");
      }
    }
    data.append("case_number", `${caseYear}/${caseNumberPart}`);

    plaintiffs
      .filter((p) => p.plaintiff_name) // أي مدعي عنده اسم
      .forEach((p, idx) => {
        data.append(`plaintiffs[${idx}][plaintiff_name]`, p.plaintiff_name);
        data.append(`plaintiffs[${idx}][national_id]`, p.national_id || "");
      });

    images.forEach((file) => data.append("documents", file));

    try {
      await axios.post("http://10.128.4.113:5000/legal_documents", data, {
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });


      setMessage("تم إرسال البيانات بنجاح!");
      setMessageType("success");
      setOpen(true);
      setConfirmOpen(false);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setFormData({
        "رقم الكتاب": "",
        "تاريخ الكتاب": "",
        "اسم المحكمة": "",
        court_id: "",
        المخيم: "",
        "رقم القطعة": "",
        "رقم الحوض": "",
        البيان: "",
        "رقم الكتاب الصادر": "",
        "تاريخ الكتاب الصادر": "",
      });
      setCaseNumberPart("");
      setPlaintiffs([{ plaintiff_name: "", national_id: "" }]);
      setImages([]);
      setPreviewURLs([]);
      setErrors([]);
    } catch (error) {
      setMessage(error.response.data.message);
      setMessageType("error");
      setOpen(true);
      console.error(error);
    }
  };

  return (
    <>
      {/* Form */}
      <Sheet
        sx={{
          maxWidth: 700,
          mx: "auto",
          mt: 5,
          p: 4,
          borderRadius: "md",
          boxShadow: "lg",
        }}
      >
        <Typography level="h3" textAlign="center" mb={2}>
          إضافة مستند قانوني جديد
        </Typography>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          encType="multipart/form-data"
        >
          <Stack spacing={2}>
            {Object.entries(formData).map(([key, value]) =>
              key === "اسم المحكمة" ? (
                <FormControl required key={key}>
                  <FormLabel>اسم المحكمة</FormLabel>
                  <Select
                    name="court_id"
                    value={formData.court_id}
                    onChange={(e, newVal) => {
                      const selectedCourt = courts.find((c) => c.id === newVal);
                      setFormData((prev) => ({
                        ...prev,
                        court_id: newVal,
                        "اسم المحكمة": selectedCourt ? selectedCourt.name : "",
                      }));
                    }}
                    placeholder="اختر المحكمة"
                  >
                    {courts.map((court) => (
                      <Option key={court.id} value={court.id}>
                        {court.name}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
              ) : key === "البيان" ? (
                <FormControl key={key} required>
                  <FormLabel>{key}</FormLabel>
                  <Textarea
                    name={key}
                    value={value}
                    onChange={handleChange}
                    minRows={3}
                  />
                </FormControl>
              ) : key === "المخيم" ? (
                <FormControl key={key} required>
                  <FormLabel>{key}</FormLabel>
                  <Select
                    name={key}
                    value={value}
                    onChange={(e, newVal) =>
                      handleChange({ target: { name: key, value: newVal } })
                    }
                    placeholder="اختر المخيم"
                  >
                    {camps.map((camp) => (
                      <Option key={camp} value={camp}>
                        {camp}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl key={key} required>
                  <FormLabel>{key}</FormLabel>
                  <Input
                    type={key.includes("تاريخ") ? "date" : "text"}
                    name={key}
                    value={value}
                    onChange={handleChange}
                  />
                </FormControl>
              )
            )}

            {/* Plaintiffs */}
            <FormLabel>المدعين</FormLabel>
            {plaintiffs.map((p, i) => (
              <Stack direction="row" spacing={2} key={i} alignItems="flex-end">
                <FormControl sx={{ flex: 2 }}>
                  <FormLabel>اسم المدعي</FormLabel>
                  <Input
                    value={p.plaintiff_name}
                    onChange={(e) =>
                      handlePlaintiffChange(i, "plaintiff_name", e.target.value)
                    }
                    placeholder="اسم المدعي"
                  />
                </FormControl>
                <FormControl sx={{ flex: 2 }}>
                  <FormLabel>الرقم الوطني</FormLabel>
                  <Input
                    value={p.national_id}
                    onChange={(e) =>
                      handlePlaintiffChange(i, "national_id", e.target.value)
                    }
                    placeholder="الرقم الوطني"
                  />
                </FormControl>
                {i > 0 && (
                  <IconButton
                    variant="outlined"
                    color="danger"
                    onClick={() => removePlaintiff(i)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Stack>
            ))}
            <Button
              variant="outlined"
              onClick={addPlaintiff}
              sx={{ alignSelf: "flex-start" }}
            >
              + إضافة مدعي
            </Button>

            {/* Case Number */}
            <FormLabel>رقم القضية</FormLabel>
            <Stack direction="row" spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <Select
                  value={caseYear}
                  onChange={(e, newVal) => setCaseYear(newVal)}
                  placeholder="السنة"
                >
                  {generateYears().map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl required sx={{ flex: 2 }}>
                <Input
                  value={caseNumberPart}
                  onChange={(e) => setCaseNumberPart(e.target.value)}
                  placeholder="رقم القضية"
                />
              </FormControl>
            </Stack>

            {/* Files */}
            <FormControl>
              <FormLabel>رفع الملفات (PDF)</FormLabel>
              <Input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleImageChange}
              />
              {images.length > 0 && (
                <ul style={{ marginTop: 8 }}>
                  {images.map((file, idx) => (
                    <li key={idx}>
                      {file.name}{" "}
                      <IconButton
                        size="sm"
                        variant="soft"
                        color="danger"
                        onClick={() => handleImageRemove(idx)}
                        sx={{ ml: 1 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
            </FormControl>

            <Button
              type="submit"
              color="primary"
              size="lg"
            >
              تأكيد البيانات
            </Button>
          </Stack>
        </form>
      </Sheet>

      {/* Result Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{ maxWidth: 400, p: 3, textAlign: "center", borderRadius: "md" }}
        >
          <ModalClose />
          {messageType === "success" ? (
            <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
          )}
          {messageType === "error" && errors.length > 0 ? (
            <ul style={{ textAlign: "right" }}>
              {errors.map((e, idx) => (
                <li key={idx} style={{ color: "red" }}>
                  {e}
                </li>
              ))}
            </ul>
          ) : (
            <Typography level="h5">{message}</Typography>
          )}
        </Sheet>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{ maxWidth: 500, p: 4, borderRadius: "md", textAlign: "right" }}
        >
          <DialogTitle>هل أنت متأكد من إرسال البيانات التالية؟</DialogTitle>
          <Stack spacing={1} mt={2} sx={{ maxHeight: 300, overflowY: "auto" }}>
            {Object.entries({
              ...formData,
              المدعين: plaintiffs
                .map((p) => `${p.plaintiff_name} (${p.national_id})`)
                .join(", "),
              "رقم القضية": `${caseYear}/${caseNumberPart}`,
            }).map(([k, v]) => (
              <Typography key={k}>
                <strong>{k}: </strong>
                {Array.isArray(v) ? v.join(", ") : v}
              </Typography>
            ))}
          </Stack>
          <DialogActions sx={{ justifyContent: "flex-start" }}>
            <Button
              variant="outlined"
              color="danger"
              onClick={() => setConfirmOpen(false)}
            >
              إلغاء
            </Button>
            <Button variant="solid" color="primary" onClick={handleSubmit}>
              إرسال
            </Button>
          </DialogActions>
        </Sheet>
      </Modal>
    </>
  );
};

export default CaseForm;
