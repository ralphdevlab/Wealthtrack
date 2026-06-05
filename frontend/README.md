# WealthTrack — Full-Stack Investment Portfolio Tracker

A full-stack web application for tracking investment portfolios in real time. Users add stock holdings, see live valuations pulled from market data APIs, view allocation breakdowns, and receive AI-generated insights about their portfolio's risk and performance.

Built with Java/Spring Boot, PostgreSQL, and a Next.js/TypeScript frontend.

> **Live demo:** _add your deployed URL here once live_

---

## Screenshots

> _Add your screenshots here. Drag images into the GitHub README editor, or place them in a `/screenshots` folder and reference them like below._

![Dashboard](screenshots/dashboard.png)
_Main dashboard showing portfolio value, holdings, allocation chart, and AI insights._

---

## What It Does

- **Track holdings** — add stocks with ticker, shares, and average cost basis
- **Live valuation** — fetches current market prices and computes real gain/loss on every load
- **Allocation breakdown** — donut chart showing portfolio weighting by holding
- **Performance highlights** — automatically surfaces best and worst performers
- **AI insights** — sends portfolio composition to an LLM and returns plain-English analysis of concentration risk and diversification
- **Secure accounts** — registration and login with hashed passwords and JWT authentication

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL with Hibernate ORM |
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS |
| **Charts** | Recharts |
| **Auth** | JWT (JSON Web Tokens), BCrypt password hashing |
| **External APIs** | Finnhub (live stock prices), OpenAI (portfolio insights) |
| **Build tools** | Maven, npm |

---

## Architecture

```
┌──────────────────┐         ┌────────────────────┐         ┌─────────────────┐
│   Next.js (UI)   │  HTTP   │  Spring Boot API   │   SQL   │   PostgreSQL    │
│  React + TS      │ ──────► │  REST controllers  │ ──────► │  users          │
│  Tailwind        │ ◄────── │  service layer     │ ◄────── │  portfolios     │
└──────────────────┘  JSON   │  JPA repositories  │         │  holdings       │
                             └─────────┬──────────┘         └─────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                          │
                    ┌─────▼─────┐            ┌───────▼──────┐
                    │  Finnhub  │            │   OpenAI     │
                    │  (prices) │            │  (insights)  │
                    └───────────┘            └──────────────┘
```

**Data model:** A `User` has many `Portfolios`; a `Portfolio` has many `Holdings`. Relationships are mapped with JPA `@ManyToOne` associations and enforced with foreign keys.

---

## Key Engineering Decisions

- **`BigDecimal` for all monetary values** — floating-point types introduce rounding errors unacceptable in financial calculations, so all prices and gains use exact decimal arithmetic.
- **Write-only password serialization** — the password field is annotated so it is accepted on input but never returned in API responses, preventing accidental exposure of hashed credentials.
- **Layered architecture** — controllers handle HTTP, services hold business logic (price fetching, performance calculation, AI calls), and repositories handle persistence, keeping concerns separated.
- **Prices fetched on demand** — the performance endpoint pulls current prices at request time and computes gain/loss, so data reflects the latest available market values.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account, returns JWT |
| `POST` | `/api/auth/login` | Authenticate, returns JWT |
| `POST` | `/api/portfolios` | Create a portfolio |
| `GET`  | `/api/portfolios/user/{userId}` | List a user's portfolios |
| `GET`  | `/api/portfolios/{id}/performance` | Holdings with live prices and gain/loss |
| `GET`  | `/api/portfolios/{id}/insights` | AI-generated portfolio analysis |
| `POST` | `/api/holdings` | Add a holding to a portfolio |
| `GET`  | `/api/holdings/portfolio/{portfolioId}` | List holdings in a portfolio |
| `DELETE` | `/api/holdings/{id}` | Remove a holding |

Interactive API documentation is available via Swagger UI at `/swagger-ui.html` when the backend is running.

---

## Running Locally

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- A free [Finnhub](https://finnhub.io) API key
- An [OpenAI](https://platform.openai.com) API key

### Backend

```bash
cd api

# Create the database
psql postgres -c "CREATE DATABASE wealthtrack;"

# Add your keys to src/main/resources/application.properties:
#   finnhub.api.key=YOUR_FINNHUB_KEY
#   openai.api.key=YOUR_OPENAI_KEY

./mvnw spring-boot:run
```
Backend runs on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## What I Learned

- Designing a relational data model with JPA and managing entity relationships
- Implementing stateless authentication with JWT and securing endpoints with Spring Security
- Integrating multiple third-party APIs (market data and an LLM) into a backend service layer
- Building a responsive, component-driven frontend in React and TypeScript
- Connecting a decoupled frontend and backend across origins with proper CORS configuration

---

## Possible Future Improvements

- Live price streaming via WebSockets instead of on-demand fetches
- Per-user portfolios wired to the authenticated JWT (multi-tenant)
- Historical performance charts over time
- Caching layer to reduce external API calls
- Unit and integration test coverage

---

## Author

**Ralph Alexandre**
[GitHub](https://github.com/ralphdevlab)
