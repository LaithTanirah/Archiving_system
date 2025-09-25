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
  Grid,
} from "@mui/joy";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  // فلاتر إضافية
  const [filters, setFilters] = useState({
    court: "",
    camp: "",
    landPlot: "",
    basinNumber: "",
    incomingDocNumber: "",
    incomingDate: "",
    outgoingDocNumber: "",
    outgoingDate: "",
  });

  const highlightMatch = (text, keyword) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ backgroundColor: "#fffb91", padding: "0 2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const fetchData = async (searchValue) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://10.128.4.113:5000/legal_documents/search/${encodeURIComponent(searchValue)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let filtered = response.data.data;

      // تطبيق الفلاتر يدويًا على البيانات المسترجعة
      filtered = filtered.filter((doc) => {
        const match = (field, value) =>
          !value || (doc[field] && doc[field].toString().includes(value));

        return (
          match("court_name", filters.court) &&
          match("camp", filters.camp) &&
          match("land_plot", filters.landPlot) &&
          match("basin_number", filters.basinNumber) &&
          match("incoming_document_number", filters.incomingDocNumber) &&
          match("incoming_date", filters.incomingDate) &&
          match("outgoing_document_number", filters.outgoingDocNumber) &&
          match("outgoing_document_date", filters.outgoingDate)
        );
      });

      setDocuments(filtered);
    } catch (err) {
      console.error("خطأ في جلب نتائج البحث:", err.message);
      setError("لا يوجد بحث مطابق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    const qFromPath = decodeURIComponent(pathParts[pathParts.length - 1] || "");
    setQuery(qFromPath);
    fetchData(qFromPath);
  }, [location.pathname]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      {/* شريط البحث الأساسي */}
      <Box display="flex" gap={1} mb={2}>
        <Input
          placeholder="اكتب كلمة البحث..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
          size="sm"
        />
        <Button
          size="sm"
          onClick={() =>
            navigate(`/dashboard/search/${encodeURIComponent(query)}`)
          }
        >
          بحث
        </Button>
      </Box>

      {/* فلاتر إضافية */}
      <Grid container spacing={1} mb={2}>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="المحكمة"
            value={filters.court}
            onChange={(e) => handleFilterChange("court", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="المخيم"
            value={filters.camp}
            onChange={(e) => handleFilterChange("camp", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="رقم القطعة"
            value={filters.landPlot}
            onChange={(e) => handleFilterChange("landPlot", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="رقم الحوض"
            value={filters.basinNumber}
            onChange={(e) => handleFilterChange("basinNumber", e.target.value)}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="رقم الوثيقة الواردة"
            value={filters.incomingDocNumber}
            onChange={(e) => handleFilterChange("incomingDocNumber", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            type="date"
            placeholder="تاريخ الورود"
            value={filters.incomingDate}
            onChange={(e) => handleFilterChange("incomingDate", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            placeholder="رقم الوثيقة الصادرة"
            value={filters.outgoingDocNumber}
            onChange={(e) => handleFilterChange("outgoingDocNumber", e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Input
            size="sm"
            type="date"
            placeholder="تاريخ الوثيقة الصادرة"
            value={filters.outgoingDate}
            onChange={(e) => handleFilterChange("outgoingDate", e.target.value)}
          />
        </Grid>
      </Grid>

      {/* زر تطبيق الفلاتر */}
      <Box mb={2}>
        <Button size="sm" onClick={() => fetchData(query)}>
          تطبيق الفلاتر
        </Button>
      </Box>

      {/* النتائج */}
      <Typography level="h4" mb={1}>
        نتائج البحث عن: "{query || '...'}"
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
                <Typography level="h6" fontWeight="lg" color="primary" mb={1}>
                  رقم القضية: {highlightMatch(doc.case_number || "—", query)}
                </Typography>

                <Typography level="body-sm" mb={0.5}>
                  المحكمة: {highlightMatch(doc.court_name || "—", query)}
                </Typography>
                <Typography level="body-sm" mb={0.5}>
                  المخيم: {highlightMatch(doc.camp || "—", query)}
                </Typography>
                <Typography level="body-sm" mb={0.5}>
                  رقم القطعة: {highlightMatch(doc.land_plot || "—", query)}
                </Typography>
                <Typography level="body-sm" mb={0.5}>
                  رقم الحوض: {highlightMatch(doc.basin_number || "—", query)}
                </Typography>

                <Typography level="body-sm" mb={0.5}>
                  رقم الوثيقة الواردة:{" "}
                  {highlightMatch(doc.incoming_document_number || "—", query)}
                </Typography>
                <Typography level="body-sm" mb={0.5}>
                  تاريخ الورود: {doc.incoming_date?.split("T")[0] || "—"}
                </Typography>

                <Typography level="body-sm" mb={0.5}>
                  رقم الوثيقة الصادرة:{" "}
                  {highlightMatch(doc.outgoing_document_number || "—", query)}
                </Typography>
                <Typography level="body-sm" mb={0.5}>
                  تاريخ الوثيقة الصادرة: {doc.outgoing_document_date?.split("T")[0] || "—"}
                </Typography>

                <Typography level="body-sm" mb={0.5}>
                  المدعين:{" "}
                  {doc.plaintiffs && doc.plaintiffs.length > 0
                    ? doc.plaintiffs.map((p, idx) => (
                        <span key={idx}>
                          {highlightMatch(p.plaintiff_name, query)}
                          {idx < doc.plaintiffs.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "—"}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Typography
                  level="body-xs"
                  color="neutral"
                  sx={{
                    maxHeight: 80,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  البيان: {highlightMatch(doc.statement || "لا يوجد بيان", query)}
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
