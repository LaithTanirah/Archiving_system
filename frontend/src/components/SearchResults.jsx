import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Input,
  Button,
} from "@mui/joy";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get("q") || "";
    setQuery(q);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://dpa-d1rm.onrender.com/legal_documents/search/${q}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDocuments(response.data.data);
      } catch (err) {
        console.error("خطأ في جلب نتائج البحث:", err.message);
        setError("حدث خطأ أثناء محاولة جلب النتائج. الرجاء المحاولة لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  return (
    <Box>
      <Box display="flex" gap={1} mb={2}>
        <Input
          placeholder="اكتب كلمة البحث..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
          size="sm"
        />
        <Button size="sm" onClick={() => navigate(`/dashboard/search?q=${encodeURIComponent(query)}`)}>
          بحث
        </Button>
      </Box>

      <Typography level="h4" mb={1}>
        نتائج البحث عن: "{query || '...' }"
      </Typography>

      {error && (
        <Typography level="body-md" color="danger" mb={1}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress size="sm" />
        </Box>
      ) : documents.length === 0 ? (
        <Typography level="body-lg" color="danger" mt={1}>
          لا توجد نتائج مطابقة
        </Typography>
      ) : (
        <>
          <Typography level="body-sm" color="neutral" mb={1}>
            عدد النتائج: {documents.length}
          </Typography>

          {documents.map((doc) => (
            <Card
              key={doc.id}
              variant="outlined"
              sx={{
                mb: 1.5,
                cursor: "pointer",
                transition: "transform 0.15s",
                p: 1.5,
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "md",
                },
              }}
              onClick={() => navigate(`/dashboard/legal_documents/${doc.id}`)}
            >
              <CardContent sx={{ p: 1 }}>
                <Typography level="h6" fontWeight="lg" color="primary" mb={0.5}>
                  رقم القضية: {doc.case_number || "—"}
                </Typography>

                <Box display="flex" justifyContent="space-between" mt={0} mb={0.5}>
                  <Typography level="body-xs">
                    المحكمة: <strong>{doc.court_name || "—"}</strong>
                  </Typography>
                  <Typography level="body-xs">
                    المدعي: <strong>{doc.plaintiff_name || "—"}</strong>
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.75 }} />

                <Typography
                  level="body-xs"
                  color="neutral"
                  sx={{
                    maxHeight: 45,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {doc.statement || "لا يوجد بيان"}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
};

export default SearchResults;
