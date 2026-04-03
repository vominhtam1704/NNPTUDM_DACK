# 💈 Barber Atelier - Appointment Management System

**Professional barber shop booking platform** with online appointment scheduling, service management, payment integration (SePay), and admin dashboard.

---

## 🎯 Project Overview

| Aspect | Details |
|--------|---------|
| **Type** | Full-stack appointment booking system |
| **Team Size** | 3 members |
| **Tech Stack** | Node.js + Express, React 18, MongoDB, SePay |
| **Models** | 10 (users, roles, products, categories, reservations, payments, carts, inventories, messages, reviews) |
| **Status** | In Development - Phase 1 (Planning) |

---

## 📦 Tech Stack

### Backend
- **Engine:** Node.js + Express.js 4.18+
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (24h) + Bcrypt
- **Payment:** SePay MBBank integration
- **File Upload:** Multer
- **Middleware:** CORS, Helmet, auth handlers

### Frontend
- **Framework:** React 18.2
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** SCSS with CSS variables
- **State:** localStorage + React Context

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 16+
- MongoDB local or Atlas
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev        # Runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with REACT_APP_API_URL=http://localhost:5000/api
npm start          # Runs on http://localhost:3000
```

### Database
```bash
# If using MongoDB Atlas, connection string is already in .env.example
# If using local MongoDB:
mongod             # Start MongoDB service
# Then import schema:
mongoimport -d barber_atelier -c users < schema.json
```

---

## 📋 Project Structure

```
barber-atelier/
├── backend/
│   ├── server.js                 (Entry point)
│   ├── src/
│   │   ├── app.js               (Express app setup)
│   │   ├── config/              (Database, constants)
│   │   ├── controllers/         (Business logic)
│   │   ├── routes/              (API endpoints)
│   │   ├── services/            (External APIs, complex logic)
│   │   ├── models/              (MongoDB schemas)
│   │   ├── middlewares/         (Auth, validation, error)
│   │   └── utils/               (Helpers, JWT, password)
│   ├── uploads/                 (User files)
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js               (Routes)
│   │   ├── index.js
│   │   ├── index.scss           (Global styles)
│   │   ├── pages/               (Page components)
│   │   ├── components/          (Reusable components)
│   │   ├── services/            (API layer)
│   │   ├── context/             (Global state)
│   │   ├── hooks/               (Custom hooks)
│   │   └── styles/              (Utilities)
│   └── package.json
│
├── docs/
│   ├── README.md                (This file)
│   ├── BARBER_MODELS_SCHEMA.md  (10 Models)
│   ├── API_ENDPOINTS.md         (All endpoints)
│   ├── SEPAY_INTEGRATION.md     (Payment guide)
│   └── QUICKSTART.md            (5-min setup)
│
└── .gitignore
```

---

## 🗃️ 10 Core Models

| # | Model | Member | Purpose |
|---|-------|--------|---------|
| 1 | **users** | M1 | Authentication & profiles |
| 2 | **roles** | M1 | Permission system (admin, barber, customer) |
| 3 | **products** | M1 | Services/haircuts with prices |
| 4 | **categories** | M1 | Service grouping |
| 5 | **reservations** ⭐ | M1 | Appointments (CORE) |
| 6 | **payments** 💳 | M1 | SePay integration |
| 7 | **carts** | M1 | Shopping cart before checkout |
| 8 | **inventories** | M1 | Stock management (shampoo, oils, etc.) |
| 9 | **messages** | M2 | Notifications & internal chat |
| 10 | **reviews** | M3 | Service ratings & feedback |

---

## 🔄 Main Workflows

### 1. Customer Booking Flow (7 steps)
1. Login → Get JWT token
2. Browse services by category
3. Select service + barber + time slot
4. Add to cart
5. Checkout with SePay (generates QR)
6. Complete payment
7. Receive confirmation message

### 2. Authentication Flow
1. Register → Hash password + create user
2. Login → Verify + issue JWT
3. Protected routes → Check JWT middleware
4. Refresh token → Extend session (7 days)
5. Logout → Blacklist token

### 3. Payment Flow (SePay)
1. Create payment record (pending)
2. Generate SePay QR code URL
3. Customer scans & transfers
4. SePay sends webhook notification
5. Verify signature & update to "paid"
6. Update appointment to "confirmed"

---

## 🔐 Security Features

✅ **Passwords:** Bcrypt hashing (10 rounds)  
✅ **Auth:** JWT with 24h expiry  
✅ **CORS:** Configurable origins  
✅ **Headers:** Helmet.js  
✅ **Input Validation:** Joi schemas  
✅ **SQL Injection Prevention:** Mongoose (parameterized)  
✅ **Webhook Verification:** SePay signature validation  

---

## 📡 API Overview (50+ endpoints)

### Auth Endpoints
```
POST   /api/auth/register        (Create account)
POST   /api/auth/login           (Get JWT)
POST   /api/auth/refresh-token   (Extend session)
POST   /api/auth/logout          (Blacklist)
```

### Users
```
GET    /api/users                (List all)
GET    /api/users/:id            (Get one)
PUT    /api/users/:id            (Update profile)
DELETE /api/users/:id            (Soft delete)
```

### Services & Booking
```
GET    /api/products             (All services)
GET    /api/categories           (Service groups)
POST   /api/reservations         (Book appointment)
GET    /api/reservations/:id     (View booking)
PATCH  /api/reservations/:id     (Update status)
```

### Payments & Checkout
```
POST   /api/payments             (Create payment)
POST   /api/payments/webhook     (SePay callback)
GET    /api/payments/:id         (Payment status)
```

> See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete 50+ endpoint list

---

## 💳 SePay Payment Setup

### Integration Steps
1. **Register** at [sepay.vn](https://sepay.vn)
2. **Get credentials:** Account number, bank code, API key
3. **Add to .env:**
   ```
   SEPAY_ACCOUNT_NUMBER=your-account
   SEPAY_BANK_CODE=MBBank
   WEBHOOK_SIGNATURE_KEY=your-key
   ```
4. **Test flow:** Create payment → Generate QR → Verify webhook

> See [SEPAY_INTEGRATION.md](./docs/SEPAY_INTEGRATION.md) for detailed guide

---

## 📅 Implementation Timeline

| Week | Focus | Member |
|------|-------|--------|
| **Week 1** | Auth (users, roles) | M1 |
| **Week 2** | Services (products, categories, carts, inventory) | M1 |
| **Week 3** | Booking & Payments (reservations, payments, messages, reviews) | M1, M2, M3 |
| **Week 4** | Frontend integration + Testing | All |

---

## ✅ Checklist for Success

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Auth endpoints tested
- [ ] SePay credentials configured
- [ ] All CRUD endpoints working
- [ ] Frontend-backend integration 100%
- [ ] Postman collection documented
- [ ] Payment flow end-to-end tested
- [ ] Admin dashboard functional

---

## 🛠️ Common Commands

```bash
# Backend
cd backend
npm run dev              # Start with hot-reload
npm run build           # Production build
npm test                # Run tests

# Frontend
cd frontend
npm start               # Development
npm run build           # Production build

# Database
mongod                  # Start MongoDB
mongoimport -d db -c collection < file.json
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide |
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | All 50+ endpoints |
| [SEPAY_INTEGRATION.md](./docs/SEPAY_INTEGRATION.md) | Payment setup |
| [BARBER_MODELS_SCHEMA.md](./BARBER_MODELS_SCHEMA.md) | 10 Models details |
| [TEAM_MEMBER_GUIDE.md](./docs/TEAM_MEMBER_GUIDE.md) | Member assignments |

---

## 🐛 Troubleshooting

**"Cannot find module"** → Run `npm install` in backend/frontend  
**MongoDB connection error** → Check `.env` MONGODB_URI  
**CORS error** → Verify `CORS_ORIGIN` in backend `.env`  
**JWT decode error** → Ensure `JWT_SECRET` matches in both .env files  

---

## 👥 Team Members

- **M1 (Lead):** Backend core (8 models)
- **M2:** Notifications + Frontend features
- **M3:** Reviews + Admin dashboard

---

## 📞 Support

For issues, check the [docs/](./docs/) folder or reach out to your team lead.

---

**Ready to build? Start with [QUICKSTART.md](./QUICKSTART.md)** 🚀
