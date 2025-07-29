import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import CaseForm from "./components/CaseForm";
import SidebarLayout from "./components/SidebarLayout";
import LegalDocumentsList from "./components/LegalDocumentsList";
import LegalDocumentDetails from "./components/LegalDocumentDetails";
import LegalDocumentEdit from "./components/LegalDocumentEdit";
import SearchResults from "./components/SearchResults";
import ExcelUpload from "./components/UploadFromExcel";
import UserList from "./components/UserList";
import AdminRoute from "./components/AdminRoute";
import AdminSidebarLayout from "./components/Sidebar"; 
import CourtsPage from "./components/CourtsList"; 

const App = () => {
  return (
    <Routes>
      {/* صفحة تسجيل الدخول */}
      <Route path="/" element={<Login />} />

      {/* لوحة تحكم الأدمن - محمية */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminSidebarLayout />}>
          <Route index element={<Register />} />
          <Route path="register" element={<Register />} />
          <Route path="users" element={<UserList />} />
          <Route path="courts" element={<CourtsPage />} />
        </Route>
      </Route>

      {/* لوحة المستخدم العادي */}
      <Route path="/dashboard" element={<SidebarLayout />}>
        <Route path="caseform" element={<CaseForm />} />
        <Route path="legal_documents" element={<LegalDocumentsList />} />
        <Route path="legal_documents/:id" element={<LegalDocumentDetails />} />
        <Route path="legal_documents/edit/:id" element={<LegalDocumentEdit />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="bulk_upload" element={<ExcelUpload />} />
      </Route>
    </Routes>
  );
};

export default App;
