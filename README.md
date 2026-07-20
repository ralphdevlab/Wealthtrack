# WealthTrack — Full-Stack Investment Portfolio Tracker

A full-stack web application for tracking investment portfolios in real time. Users create an account, add stock holdings, see live valuations pulled from market data APIs, view allocation breakdowns, and receive AI-generated insights about their portfolio's risk and performance.

Built with Java/Spring Boot, PostgreSQL, and a Next.js/TypeScript frontend. Fully deployed with JWT-secured authentication.

**Live demo:** (https://wealthtrack-6cqz.vercel.app/)

> _The backend runs on a free hosting tier and sleeps after inactivity — the first request may take up to a minute to wake up._

---

## Screenshots

![Dashboard](screenshots/dashboard.png)
_Main dashboard: portfolio value, holdings with live prices, allocation chart, and AI insights._

---

## Features

- **Account system** — registration, login, and logout with JWT authentication and BCrypt password hashing
- **Multi-user data isolation** — each user sees only their own portfolios and holdings, enforced server-side from the token
- **Live valuation** — fetches current market prices and computes gain/loss per holding on every load
- **Portfolio management** — create portfolios, add and delete holdings with confirmation dialogs
- **Allocation breakdown** — donut chart showing portfolio weighting by position
- **Performance highlights** — automatically surfaces best and worst performers
- **AI insights** — sends portfolio composition to an LLM and returns plain-English analysis of concentration risk and diversification
- **Account deletion** — cascading delete of holdings, portfolios, and user record inside a single transaction

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL with Hibernate ORM |
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS |
| **Charts** | Recharts |
| **Auth** | JWT (stateless), BCrypt password hashing |
| **External APIs** | Finnhub (live stock prices), OpenAI (portfolio insights) |
| **Deployment** | Docker + Render (API & database), Vercel (frontend) |

---

## Architecture

```
┌──────────────────┐         ┌────────────────────┐         ┌─────────────────┐
│  Next.js (UI)    │  HTTPS  │  Spring Boot API   │   SQL   │   PostgreSQL    │
│  React + TS      │ ──────► │  JWT filter        │ ──────► │  users          │
│  Tailwind        │ ◄────── │  REST controllers  │ ◄────── │  portfolios     │
│  (Vercel)        │  JSON   │  service layer     │         │  holdings       │
└──────────────────┘         │  (Render / Docker) │         │   (Render)      │
                             └─────────┬──────────┘         └─────────────────┘
                                       │
                          ┌────────────┴────────────┐
                    ┌─────▼─────┐            ┌──────▼───────┐
                    │  Finnhub  │            │   OpenAI     │
                    │  (prices) │            │  (insights)  │
                    └───────────┘            └──────────────┘
```

**Data model:** A `User` has many `Portfolios`; a `Portfolio` has many `Holdings`. Relationships are mapped with JPA `@ManyToOne` associations and enforced with foreign keys.

---

## Key Engineering Decisions

- **`BigDecimal` for all monetary values** — floating-point types introduce rounding errors unacceptable in financial calculations, so prices and gains use exact decimal arithmetic.
- **Stateless JWT authentication** — a custom `OncePerRequestFilter` validates the bearer token on every request and populates the security context. No server-side sessions, so the API can scale horizontally.
- **Write-only password serialization** — the password field is accepted on input but never returned in API responses, preventing exposure of hashed credentials.
- **CORS configured inside the security filter chain** — once a security filter is registered it runs before Spring MVC's CORS handling, so CORS must be declared within `SecurityFilterChain` for preflight requests to pass.
- **Transactional cascade deletes** — account deletion removes holdings, then portfolios, then the user inside one transaction, so a partial failure can't leave orphaned records.
- **Configuration via environment variables** — no credentials or API keys in source control; the same build runs locally and in production with different injected config.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Create an account, returns JWT |
| `POST` | `/api/auth/login` | Public | Authenticate, returns JWT |
| `GET` | `/api/users/me` | JWT | Current user's profile |
| `DELETE` | `/api/users/me` | JWT | Delete account and all associated data |
| `POST` | `/api/portfolios` | JWT | Create a portfolio for the current user |
| `GET` | `/api/portfolios/me` | JWT | Current user's portfolios |
| `GET` | `/api/portfolios/{id}/performance` | JWT | Holdings with live prices and gain/loss |
| `GET` | `/api/portfolios/{id}/insights` | JWT | AI-generated portfolio analysis |
| `POST` | `/api/holdings` | JWT | Add a holding |
| `DELETE` | `/api/holdings/{id}` | JWT | Remove a holding |

---

## Running Locally

### Prerequisites
- Java 17+, Node.js 18+, PostgreSQL 14+
- A free [Finnhub](https://finnhub.io) API key
- An [OpenAI](https://platform.openai.com) API key

### Backend

```bash
cd api

# Create the database
psql postgres -c "CREATE DATABASE wealthtrack;"

# Set your keys (add to ~/.zshrc to persist)
export FINNHUB_API_KEY="your-key"
export OPENAI_API_KEY="your-key"

./mvnw spring-boot:run
```
Runs on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install

# Create .env.local with:
#   NEXT_PUBLIC_API_URL=http://localhost:8080

npm run dev
```
Runs on `http://localhost:3000`.

---

## What I Learned

- Implementing stateless authentication end to end: token generation, a custom Spring Security filter, protected routes, and frontend token handling
- Designing a relational schema with JPA and managing entity relationships and cascading deletes
- Integrating multiple third-party APIs into a backend service layer
- Containerizing a Spring Boot application with a multi-stage Docker build
- Deploying a decoupled frontend and backend across two platforms, including CORS and environment configuration

---

## Possible Future Improvements

- Live price streaming via WebSockets instead of on-demand fetches
- Historical performance charts over time
- Caching layer to reduce external API calls
- httpOnly cookie storage for tokens instead of localStorage (mitigates XSS)
- Unit and integration test coverage

---

## Author

**Ralph Alexandre**
[GitHub](https://github.com/ralphdevlab)
