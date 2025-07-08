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

const CaseForm = () => {
  const [formData, setFormData] = useState({
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

  // مصفوفة المدعين: كل مدعي عنده اسم ورقم وطني
  const [plaintiffs, setPlaintiffs] = useState([
    { plaintiff_name: "", national_id: "" },
  ]);

  const [caseYear, setCaseYear] = useState(new Date().getFullYear());
  const [caseNumberPart, setCaseNumberPart] = useState("");
  const [images, setImages] = useState([]);
  const [previewURLs, setPreviewURLs] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [courts, setCourts] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await axios.get("https://dpa-d1rm.onrender.com/courts", {
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

  // تحديث بيانات المدعي عند index معين
  const handlePlaintiffChange = (index, field, value) => {
    const newPlaintiffs = [...plaintiffs];
    newPlaintiffs[index][field] = value;
    setPlaintiffs(newPlaintiffs);
  };

  // إضافة مدعي جديد
  const addPlaintiff = () => {
    setPlaintiffs([...plaintiffs, { plaintiff_name: "", national_id: "" }]);
  };

  // حذف مدعي حسب index
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

  // التحقق من صحة الحقول بما فيها المدعين
  const isValidForm = () => {
    const mainFieldsValid = Object.entries(formData)
      .filter(([key]) => key !== "court_id")
      .every(([_, val]) => typeof val === "string" && val.trim() !== "");

    const plaintiffsValid = plaintiffs.every((p) => {
      const name = p.plaintiff_name.trim();
      const id = p.national_id.trim();
      return (name === "" && id === "") || (name !== "" && /^\d{10}$/.test(id));
    });

    return mainFieldsValid && plaintiffsValid && caseNumberPart.trim() !== "";
  };

  const handleSubmit = async () => {
    const data = new FormData();

    for (const [arKey, enKey] of Object.entries(fieldMap)) {
      if (arKey === "اسم المحكمة") {
        data.append("court_id", formData["court_id"] || "");
      } else {
        data.append(enKey, formData[arKey] || "");
      }
    }

    data.append("case_number", `${caseYear}/${caseNumberPart}`);

    // ✅ فقط المدعين الصالحين
    const validPlaintiffs = plaintiffs.filter(
      (p) =>
        p.plaintiff_name.trim() !== "" && /^\d{10}$/.test(p.national_id.trim())
    );

    validPlaintiffs.forEach((plaintiff, idx) => {
      data.append(
        `plaintiffs[${idx}][plaintiff_name]`,
        plaintiff.plaintiff_name
      );
      data.append(`plaintiffs[${idx}][national_id]`, plaintiff.national_id);
    });

    images.forEach((file) => data.append("documents", file));

    try {
      const res = await axios.post(
        "https://dpa-d1rm.onrender.com/legal_documents",
        data,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("تم إرسال البيانات بنجاح!");
      setMessageType("success");
      setOpen(true);
      setConfirmOpen(false);

      // إعادة تعيين الحقول
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
    } catch (error) {
      setMessage("حدث خطأ أثناء الإرسال، الرجاء المحاولة لاحقًا.");
      setMessageType("error");
      setOpen(true);
      console.error("Error posting data:", error);
    }
  };

  return (
    <>
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
            if (isValidForm()) setConfirmOpen(true);
          }}
          encType="multipart/form-data"
        >
          <Stack spacing={2}>
            {Object.entries(formData).map(([key, value]) =>
              key === "اسم المحكمة" ? (
                <FormControl required>
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
                    error={key === "الرقم الوطني" && !/^\d{0,10}$/.test(value)}
                  />
                  {key === "الرقم الوطني" &&
                    value &&
                    !/^\d{10}$/.test(value) && (
                      <Typography level="body-sm" color="danger" mt={0.5}>
                        الرقم الوطني يجب أن يتكون من 10 أرقام.
                      </Typography>
                    )}
                </FormControl>
              )
            )}

            {/* حقول المدعين */}
            <FormLabel>المدعين</FormLabel>
            {plaintiffs.map((plaintiff, index) => (
              <Stack
                direction="row"
                spacing={2}
                key={index}
                alignItems="flex-end"
              >
                <FormControl sx={{ flex: 2 }}>
                  <FormLabel>اسم المدعي</FormLabel>
                  <Input
                    value={plaintiff.plaintiff_name}
                    onChange={(e) =>
                      handlePlaintiffChange(
                        index,
                        "plaintiff_name",
                        e.target.value
                      )
                    }
                    placeholder="اسم المدعي"
                  />
                </FormControl>
                <FormControl sx={{ flex: 2 }}>
                  <FormLabel>الرقم الوطني</FormLabel>
                  <Input
                    value={plaintiff.national_id}
                    onChange={(e) =>
                      handlePlaintiffChange(
                        index,
                        "national_id",
                        e.target.value
                      )
                    }
                    placeholder="الرقم الوطني"
                  />
                </FormControl>
                {index > 0 && (
                  <IconButton
                    variant="outlined"
                    color="danger"
                    onClick={() => removePlaintiff(index)}
                    sx={{ mb: 1 }}
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

            {/* رقم القضية (سنة / رقم) */}
            <FormLabel>رقم القضية</FormLabel>
            <Stack direction="row" spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <Select
                  value={caseYear}
                  onChange={(e, newVal) => setCaseYear(newVal)}
                  placeholder="السنة"
                >
                  {generateYears().map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </FormControl>
              <FormControl required sx={{ flex: 2 }}>
                <Input
                  placeholder="رقم القضية"
                  value={caseNumberPart}
                  onChange={(e) => setCaseNumberPart(e.target.value)}
                />
              </FormControl>
            </Stack>

            <FormControl>
              <FormLabel>رفع الملفات (PDF)</FormLabel>
              <Input
                name="documents"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleImageChange}
              />
              {images.length > 0 && (
                <ul style={{ marginTop: 8 }}>
                  {images.map((file, idx) => (
                    <li key={idx}>
                      {file.name}
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

            <Button type="submit" color="primary" size="lg">
              تأكيد البيانات
            </Button>
          </Stack>
        </form>
      </Sheet>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{ maxWidth: 400, borderRadius: "md", p: 3, textAlign: "center" }}
        >
          <ModalClose />
          {messageType === "success" ? (
            <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
          )}
          <Typography level="h5">{message}</Typography>
        </Sheet>
      </Modal>

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
            }).map(([key, val]) => (
              <Typography key={key} textAlign="right">
                <strong>{key}: </strong>
                {Array.isArray(val) ? val.join(", ") : val}
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
            <Button
              variant="solid"
              color="primary"
              onClick={handleSubmit}
              disabled={!isValidForm()}
            >
              إرسال
            </Button>
          </DialogActions>
        </Sheet>
      </Modal>
    </>
  );
};

export default CaseForm;
