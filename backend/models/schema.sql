-- Build Your Tables Here --

CREATE TABLE users(
    id SERIAL NOT NULL,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    is_deleted SMALLINT DEFAULT 0,
    PRIMARY KEY (id)
);

-------------------------------------------------------

CREATE TABLE legal_documents (
  id SERIAL PRIMARY KEY,
  incoming_document_number VARCHAR(50),
  incoming_date DATE,
  court_name VARCHAR(255),
  case_number VARCHAR(50),
  camp VARCHAR(255),
  land_plot VARCHAR(255),
  basin_number VARCHAR(50),
  plaintiff_name VARCHAR(255),
  statement TEXT,
  outgoing_document_number VARCHAR(50),
  outgoing_document_date DATE,
  national_id VARCHAR(20),
  images VARCHAR[]
);


--------------------------------------------------------



رقم الكتاب الوارد  : Incoming Document Number
تاريخه  : Date
اسم المحكمة  : Court Name
رقم الدعوة  : Case Number
المخيم  : Camp
قطعة الارض : Land Plot
رقم الحوض : Basin Number
اسم المدعي : Plaintiff Name
البيان : Statement
رقم الكتاب الصادر : Outgoing Document Number
تاريخ الكتاب الصادر : Outgoing Document Date