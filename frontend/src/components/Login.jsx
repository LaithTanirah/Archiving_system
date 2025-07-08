// Login.js
import { useState } from "react";
import "./App.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";

const Login = () => {
  const [value, setValue] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const loginButtonEvent = (e) => {
    if (!value.email || !value.password) {
      setMessage("البريد الإلكتروني وكلمة المرور مطلوبة.");
      setMessageType("error");
      setOpen(true);
      return;
    }

    axios
      .post("http://localhost:5000/users/login", {
        email: value.email,
        password: value.password,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userEmail", value.email);

        setMessage("تم تسجيل الدخول بنجاح!");
        setMessageType("success");
        setOpen(true);

        setTimeout(() => {
          setOpen(false);
          if (value.email === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard/caseform");
          }
        }, 2000);
      })
      .catch((e) => {
        const errorMessage =
          e.response?.data?.message || "فشل تسجيل الدخول. حاول مرة أخرى.";
        setMessage(errorMessage);
        setMessageType("error");
        setOpen(true);
      });
  };

  return (
    <div className="login-container" style={{ direction: "rtl", textAlign: "right" }}>
      <div className="login-form">
        <h2 className="h2">تسجيل الدخول</h2>
        <div>
          <label className="label">البريد الإلكتروني</label>
          <input
            className="input"
            type="text"
            required
            onChange={(e) => setValue({ ...value, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">كلمة المرور</label>
          <input
            className="input"
            type="password"
            required
            onChange={(e) => setValue({ ...value, password: e.target.value })}
          />
        </div>
        <button className="button" onClick={loginButtonEvent}>
          تسجيل الدخول
        </button>
      </div>

      {/* رسالة الخطأ أو النجاح */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 400,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            textAlign: "center",
            m: "auto",
            mt: "15%",
          }}
        >
          <ModalClose />
          {messageType === "error" ? (
            <ErrorOutline color="error" fontSize="large" />
          ) : (
            <CheckCircle color="success" fontSize="large" />
          )}
          <Typography level="h5" mt={2}>
            {message}
          </Typography>
        </Sheet>
      </Modal>
    </div>
  );
};

export default Login;
