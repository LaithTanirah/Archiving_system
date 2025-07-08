import { useState } from "react";
import "./App.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";

const Register = () => {
  const [value, setValue] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Regular expression for email and strong password validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const registerButtonEvent = () => {
    if (!value.firstName || !value.lastName || !value.email || !value.password) {
      setMessage("جميع الحقول مطلوبة.");
      setMessageType("error");
      setOpen(true);
      return;
    }

    // Email validation
    if (!emailRegex.test(value.email)) {
      setMessage("البريد الإلكتروني غير صحيح.");
      setMessageType("error");
      setOpen(true);
      return;
    }

    // Password validation
    if (!passwordRegex.test(value.password)) {
      setMessage("كلمة المرور ضعيفة. تأكد من أن كلمة المرور تحتوي على 8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص.");
      setMessageType("error");
      setOpen(true);
      return;
    }

    // Submit the form if validation passes
    axios
      .post("https://dpa-5xfw.onrender.com/users/register", value)
      .then((res) => {
        setMessage("تم التسجيل بنجاح!");
        setMessageType("success");
        setOpen(true);
        setTimeout(() => {
          setOpen(false);
        }, 2000);
      })
      .catch((e) => {
        const errorMessage = "فشل التسجيل، الرجاء المحاولة لاحقاً.";
        setMessage(errorMessage);
        setMessageType("error");
        setOpen(true);
      });
  };

  return (
    <div className="login-container" style={{ direction: "rtl", textAlign: "right" }}>
      <div className="login-form">
        <h2 className="h2">تسجيل حساب جديد</h2>

        <div>
          <label className="label">الاسم الأول</label>
          <input
            className="input"
            type="text"
            value={value.firstName}
            required
            onChange={(e) => setValue({ ...value, firstName: e.target.value })}
          />
        </div>

        <div>
          <label className="label">اسم العائلة</label>
          <input
            className="input"
            type="text"
            value={value.lastName}
            required
            onChange={(e) => setValue({ ...value, lastName: e.target.value })}
          />
        </div>

        <div>
          <label className="label">البريد الإلكتروني</label>
          <input
            className="input"
            type="email"
            value={value.email}
            required
            onChange={(e) => setValue({ ...value, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">كلمة المرور</label>
          <input
            className="input"
            type="password"
            value={value.password}
            required
            onChange={(e) => setValue({ ...value, password: e.target.value })}
          />
        </div>

        <button className="button" onClick={registerButtonEvent}>
          تسجيل
        </button>
      </div>

      <Modal
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        color={messageType === "error" ? "danger" : "primary"}
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 500,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            textAlign: "right",
            direction: "rtl",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          {messageType === "success" ? (
            <CheckCircle sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 48, color: "error.main", mb: 2 }} />
          )}
          <Typography component="h2" id="modal-title" level="h4" sx={{ fontWeight: "lg", mb: 1 }}>
            {message}
          </Typography>
        </Sheet>
      </Modal>
    </div>
  );
};

export default Register;
