import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Sheet,
  Typography,
  Stack,
  Box,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/joy";
import { useNavigate } from "react-router-dom";
import ImageIcon from "@mui/icons-material/Image";

const LegalDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/legal_documents", {
        headers: { authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDocuments(res.data.data); // تأكد أن backend يرجعها بـ result
        setLoading(false);
      })
      .catch(() => {
        setDocuments([]);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Sheet
      sx={{
        maxWidth: 800,
        mx: "auto",
        mt: 5,
        p: 3,
        borderRadius: "md",
        boxShadow: "sm",
      }}
    >
      <Typography level="h3" mb={3} textAlign="center">
        قائمة المستندات القانونية
      </Typography>

      {documents.length === 0 ? (
        <Typography textAlign="center">لا يوجد مستندات بعد.</Typography>
      ) : (
        <Stack spacing={2}>
          {documents.map((doc) => (
            <Sheet
              key={doc.id}
              onClick={() => navigate(`/dashboard/legal_documents/${doc.id}`)}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: "sm",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#f0f4f8" },
              }}
            >
              <Typography level="h5" mb={1}>
                📄 {doc.case_number || "بدون رقم قضية"}
              </Typography>
              <Typography level="body2" mb={1}>
                المحكمة: {doc.court_name || "غير محددة"} - التاريخ:{" "}
                {doc.incoming_date
                  ? new Date(doc.incoming_date).toLocaleDateString("ar-EG")
                  : "غير متوفر"}
              </Typography>

              {doc.images && doc.images.length > 0 && (
                <Chip
                  variant="soft"
                  color="primary"
                  startDecorator={<ImageIcon />}
                >
                  {doc.images.length} صورة
                </Chip>
              )}
            </Sheet>
          ))}
        </Stack>
      )}
    </Sheet>
  );
};

export default LegalDocumentsList;
