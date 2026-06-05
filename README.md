# E-Commerce Backend (E-commerce-BE)

A robust, enterprise-grade RESTful API backend for E-Commerce applications. Built using **TypeScript**, **Node.js**, **Express**, and **Sequelize** with **PostgreSQL**, this backend handles authentication, user profiles, categorizations, product inventory management, user addresses, transactional emails (via Resend), and push notification integration (via Firebase Admin Cloud Messaging).

---

## 🚀 Tech Stack & Features

- **Runtime Environment:** [Node.js](https://nodejs.org/) (ES Modules)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database ORM:** [Sequelize](https://sequelize.org/) & [Sequelize-TypeScript](https://github.com/sequelize/sequelize-typescript)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (hosted on Supabase)
- **Authentication & Security:** JWT (JSON Web Tokens), cookies, and password hashing with `bcrypt`
- **Email Service:** [Resend API](https://resend.com/) for email delivery (e.g., forgot password links)
- **Push Notifications:** [Firebase Admin SDK](https://firebase.google.com/docs/admin) for FCM push notifications

---

## 📁 Project Architecture

The workspace follows a clean, modular structure separating models, controllers, routing, configuration, and helpers:

```text
E-commerce-BE/
├── config/                  # Sequelize-CLI configuration
│   └── config.js
├── migrations/              # SQL/CJS migrations
│   ├── 20260311080000-create-users-table.cjs
│   ├── 20260311083834-add-access-token-column-to-users.cjs
│   ├── 20260311090000-create-categories-table.cjs
│   ├── 20260605095238-create-products-table.cjs
│   └── 20260605113000-create-addresses-table.cjs
├── src/
│   ├── config/              # Third-party configurations
│   │   └── firebaseConfig/  # Firebase Admin SDK setup & keys
│   ├── Database/            # Database initialization and connection
│   │   └── db.ts            # Sequelize instance, migrations runner, & model sync
│   ├── controllers/         # Business logic layer
│   │   ├── AuthController/  # Signup, login, reset-password logic
│   │   ├── UserController/  # Profile fetching, updates, search/list
│   │   ├── CategoryController/ # Categories CRUD logic
│   │   ├── ProductController/  # Products CRUD logic
│   │   └── AddressController/  # User shipping addresses CRUD logic
│   ├── model/               # Sequelize-TypeScript Models
│   │   ├── user.model.ts    # User model definition
│   │   ├── category.model.ts# Category model definition
│   │   ├── product.model.ts # Product model definition
│   │   └── address.model.ts # User address model definition
│   ├── routes/              # Express API endpoints
│   │   ├── user.route.ts    # User/Auth routes
│   │   ├── category.route.ts# Category routes
│   │   ├── product.route.ts # Product routes
│   │   └── address.route.ts # User address routes
│   ├── utils/               # Shared helper utilities
│   │   ├── asyncWrapper.ts  # Global async error handler
│   │   ├── responseHandler.ts # Standardized API response format
│   │   └── sendEmail.ts     # Resend client & transactional emails
│   └── index.ts             # Application entry point
├── .env                     # Local configuration parameters (git-ignored)
├── tsconfig.json            # TypeScript configuration
└── package.json             # Build commands & dependencies
```

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A running [PostgreSQL](https://www.postgresql.org/) instance (or Supabase credentials)

### 1. Installation

Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (based on `.env.example` if available) and specify the following variables:

```ini
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>
JWT_SECRET=your_jwt_secret_key
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_NAME=your_db_name
DB_USER=your_db_username
DB_PASSWORD=your_db_password
RESEND_API_KEY=re_your_resend_api_key
CLIENT_URL=http://localhost:5173
```

### 3. Database Migration & Initialization

On server startup, the application connects to the database and automatically runs all pending migration files programmatically using the **Umzug** migration manager. Migration history is recorded in the `SequelizeMeta` table to prevent re-execution. No manual migration command is required.

#### 👤 Default Admin Account
During the initial migration execution, a default administrator account is seeded:
- **Email:** `admin@ecommerce.com`
- **Password:** `123`
- **Role:** `admin`

### 4. Running the Server

#### Development Mode (with hot-reloading)
```bash
npm run dev
```

#### Production Mode
```bash
# 1. Build the TypeScript files to dist/
npm run build

# 2. Run the transpiled production build
npm start
```

---

## ⚡ API Endpoint Documentation

### Authentication & Users (`/api/users`)

| HTTP Method | Route | Description | Auth Required | Request Body / Header |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/users/create` | Registers a new user account | No | `{ first_name, last_name, email, password, phone_number, role? }` |
| **POST** | `/api/users/login` | Authenticates a user & returns token cookie | No | `{ email, password, fcm_token? }` |
| **PUT** | `/api/users/forgot-password` | Sends password reset email via Resend | **Yes** | `{ email }` |
| **PUT** | `/api/users/reset-password` | Resets password using token | **Yes** | `{ token, newPassword }` |
| **POST** | `/api/users/alluser` | Fetch and query all users (supports pagination/search/sort) | **Yes** | See [Pagination & Search Pattern](#-pagination-search--sorting-pattern) below |
| **GET** | `/api/users/profile` | Retrieve the authenticated user's profile | **Yes** | None |
| **PUT** | `/api/users/update` | Update user details | **Yes** | `{ first_name?, last_name?, email?, phone_number?, role? }` |
| **DELETE**| `/api/users/delete/:id` | Delete a specific user by UUID | **Yes** | Path parameter: `id` |

---

### Categories API (`/api/categories`)

| HTTP Method | Route | Description | Auth Required | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/categories/create` | Creates a new category | **Yes** | `{ name, description }` |
| **GET** | `/api/categories/all` | Fetch all categories (includes Products) | **Yes** | None |
| **GET** | `/api/categories/:id` | Fetch category by ID (includes Products) | **Yes** | None |
| **PUT** | `/api/categories/update/:id` | Update category details by ID | **Yes** | `{ name?, description? }` |
| **DELETE**| `/api/categories/delete/:id` | Delete category by ID | **Yes** | None |

---

### Products API (`/api/products`)

| HTTP Method | Route | Description | Auth Required | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/products/create` | Creates a new product | **Yes** | `{ name, description, price, stock, category_id, image }` |
| **GET** | `/api/products/all` | Fetch all products (includes Category) | **Yes** | None |
| **GET** | `/api/products/:id` | Fetch product by ID (includes Category) | **Yes** | None |
| **PUT** | `/api/products/update/:id` | Update product details by ID | **Yes** | `{ name?, description?, price?, stock?, category_id?, image? }` |
| **DELETE**| `/api/products/delete/:id` | Delete product by ID | **Yes** | None |

---

### Addresses API (`/api/addresses`)

| HTTP Method | Route | Description | Auth Required | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/addresses/create` | Save new shipping address | **Yes** | `{ user_id, full_name, address, city, state, pincode, phone_number, country }` |
| **GET** | `/api/addresses/all` | Fetch all saved addresses (includes User) | **Yes** | None |
| **GET** | `/api/addresses/:id` | Fetch address details by ID (includes User) | **Yes** | None |
| **PUT** | `/api/addresses/update/:id` | Update saved address by ID | **Yes** | `{ user_id?, full_name?, address?, city?, state?, pincode?, phone_number?, country? }` |
| **DELETE**| `/api/addresses/delete/:id` | Remove address record by ID | **Yes** | None |

---

## 🔍 Pagination, Search & Sorting Pattern

The `/api/users/alluser` endpoint utilizes a dynamic query payload structure.

### Request Body Schema

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "filter": {
    "search": ["first_name", "last_name", "email"],
    "keyword": "John"
  },
  "sort": {
    "created_at": "DESC"
  }
}
```

- **`pagination`**: 
  - `page`: Page index (default: `1`).
  - `limit`: Records per page (default: `10`).
- **`filter`**: 
  - `search`: Array of model column names to search against.
  - `keyword`: The substring to match (uses case-insensitive `iLike` in PostgreSQL).
- **`sort`**: 
  - Object specifying the column to sort and the order direction (`"ASC"` or `"DESC"`).

---

## 🛠️ Code Conventions & Architecture Best Practices

- **Controllers:** Controllers are defined as class-based Singletons, exporting a static instance (`export const addressController = new AddressController()`). Methods are declared as Arrow functions (`public createAddress = asynWrapper(async (req, res) => { ... })`) to cleanly preserve lexical scopes and omit manual route binders.
- **Asynchronous Wrappers:** Route handlers are wrapped in `asynWrapper` to capture exceptions and deliver standardized `400 Bad Request` JSON responses instead of crashing the server instance.
- **Unified Responses:** All API responses adhere to the standard structure managed by `sendResponse`:
  ```json
  {
    "success": true,
    "message": "Fetched successfully",
    "data": [...]
  }
  ```
- **Optional Chaining:** Follows the clean code pattern of optional chaining (`?.`) when evaluating incoming headers, query params, cookies, and nested database outputs.
- **Circular Dependency Resolution**: Relational models (like `Product` and `Category`) employ the **Interface Extension** pattern:
  ```typescript
  import CategoryClass from "./category.model.js";
  interface Category extends CategoryClass {}
  // Now `@BelongsTo(() => CategoryClass)` and `category!: Category` compile flawlessly!
  ```
