# Artha Expense Tracker

A local expense tracker with a React frontend and Java Spring Boot backend. Expenses are stored in memory and reset when the backend restarts.

## Run locally

### Backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`.

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the Java service.