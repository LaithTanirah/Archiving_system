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

-------------------------------------------------------
-------------------------------------------------------
-- TABLE: courts
CREATE TABLE courts (
    id INT IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    CONSTRAINT courts_pkey PRIMARY KEY (id),
    CONSTRAINT courts_name_key UNIQUE (name)
);

-- TABLE: legal_documents
CREATE TABLE legal_documents (
    id INT IDENTITY(1,1),
    incoming_document_number NVARCHAR(50),
    incoming_date DATE,
    case_number NVARCHAR(50),
    camp NVARCHAR(255),
    land_plot NVARCHAR(255),
    basin_number NVARCHAR(50),
    statement NVARCHAR(MAX),
    outgoing_document_number NVARCHAR(50),
    outgoing_document_date DATE,
    is_deleted SMALLINT DEFAULT 0,
    court_id INT NOT NULL,
    CONSTRAINT legal_documents_pkey PRIMARY KEY (id),
    CONSTRAINT fk_court FOREIGN KEY (court_id) REFERENCES courts(id)
);

-- TABLE: legal_document_images
CREATE TABLE legal_document_images (
    id INT IDENTITY(1,1),
    document_id INT,
    image_path NVARCHAR(MAX) NOT NULL,
    CONSTRAINT legal_document_images_pkey PRIMARY KEY (id),
    CONSTRAINT legal_document_images_document_id_fkey 
        FOREIGN KEY (document_id) 
        REFERENCES legal_documents(id) 
        ON DELETE CASCADE
);

-- TABLE: plaintiffs
CREATE TABLE plaintiffs (
    id INT IDENTITY(1,1),
    document_id INT NOT NULL,
    plaintiff_name NVARCHAR(255),
    national_id NVARCHAR(20),
    CONSTRAINT plaintiffs_pkey PRIMARY KEY (id),
    CONSTRAINT plaintiffs_document_id_fkey 
        FOREIGN KEY (document_id) 
        REFERENCES legal_documents(id) 
        ON DELETE CASCADE
);

-- TABLE: users
CREATE TABLE users (
    id INT IDENTITY(1,1),
    firstname NVARCHAR(255),
    lastname NVARCHAR(255),
    email NVARCHAR(255) NOT NULL,
    password NVARCHAR(255),
    is_deleted SMALLINT DEFAULT 0,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

