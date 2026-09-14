# Accounting Backend

Multi-company accounting backend built with Spring Boot 3.2 / Java 17, JWT authentication,
and role+permission based authorization (RBAC), matching the provided PostgreSQL schema.

## Stack

- Java 25, Spring Boot 4.1.1 (Spring Framework 7, Jakarta EE 11)
- Spring Web, Spring Data JPA, Spring Security 7, Spring Validation
- PostgreSQL
- JJWT 0.12.6 (JWT issuing/validation)
- Flyway (via `spring-boot-starter-flyway`, required for auto-configuration on Boot 4.x) — schema + seed data, source of truth for the DB schema
- springdoc-openapi 3.1.0 (Swagger UI, targets Spring Framework 7 / Boot 4)
- Lombok 1.18.42 (JDK 25 compatible; registered explicitly as an annotation processor — required from JDK 23+ onward)

## Project layout

```
accounting-backend/
├── pom.xml
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── V1__init_schema.sql   (companies, users, roles, permissions, join tables)
│       └── V2__seed_data.sql     (demo company, full permission catalog, ADMIN role, admin user)
└── src/main/java/com/yourcompany/accounting/
    ├── AccountingApplication.java
    ├── common/        (exceptions, ResultJson, audit base entities)
    ├── security/       (JWT filter/service, SecurityConfig, CORS, RBAC helpers, handlers)
    ├── auth/           (login, refresh, change-password)
    ├── user/           (user CRUD + role assignment)
    ├── role/           (role CRUD + permission assignment)
    ├── permission/     (permission master CRUD)
    └── company/        (company CRUD + user↔company assignment)
```

## 1. Prerequisites

- JDK 25 (Temurin/OpenJDK) — Spring Boot 4.1.1 supports Java 21+ with first-class Java 25 support
- Maven 3.9+
- PostgreSQL 14+ running locally (or reachable)

## 2. Database setup

Create an empty database — Flyway will create all tables and seed data on first startup:

```sql
CREATE DATABASE accounting_db;
```

Update `src/main/resources/application.yml` if your credentials differ from the defaults:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/accounting_db
    username: postgres
    password: postgres
```

**Important:** change `app.jwt.secret` in `application.yml` to your own long random value before
deploying anywhere beyond local testing.

## 3. Build & run

```bash
cd accounting-backend
mvn clean install
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. On first startup, Flyway runs:

- `V1__init_schema.sql` — creates all 7 tables from the provided schema
- `V2__seed_data.sql` — seeds:
  - 1 demo company (`DEMO001`)
  - 10 permissions (USER_*, ROLE_MANAGE, PERMISSION_MANAGE, COMPANY_*)
  - 2 roles: `ADMIN` (all permissions), `ACCOUNTANT` (view-only)
  - 1 admin user, assigned the `ADMIN` role and the demo company
- `V1` also creates 7 supporting indexes (on the `user_roles`, `role_permissions`,
  `user_companies` FK columns and `permissions.module`) matching your latest schema.

## 4. Login

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

Response includes `accessToken` and `refreshToken`. Send the access token as:

```
Authorization: Bearer <accessToken>
```

on every subsequent request. For company-scoped operations, also send:

```
X-Company-Id: 11111111-1111-1111-1111-111111111111
```

(the seeded demo company id).

## 5. Testing

Two ways to test end-to-end, both in `test-data/`:

1. **Postman collection** — `accounting-backend.postman_collection.json`. Import it into Postman,
   run "Login" first (it auto-captures the access/refresh tokens into collection variables), then
   run any other request in any order.
2. **Raw JSON bodies** — one file per request type (`01_login_request.json` through
   `12_assign_user_to_company_request.json`) if you prefer curl/Insomnia/HTTPie.

Example with curl:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d @test-data/01_login_request.json | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

curl -s http://localhost:8080/api/companies \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## 6. API surface

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | login, refresh, change-password (public except change-password) |
| Users | `/api/users` | CRUD + `/{{id}}/roles` assignment — admin-only except self-read |
| Roles | `/api/roles` | CRUD + `/{{id}}/permissions` assignment — admin-only |
| Permissions | `/api/permissions` | CRUD — admin-only |
| Companies | `/api/companies` | CRUD, `/assign-user`, `/for-user/{{userId}}` |

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 7. Notes / known limitations

- I could not run `mvn compile` in the sandbox this was generated in (no access to Maven Central),
  so run `mvn clean compile` yourself as a first sanity check after downloading. I did run the
  source through a real `javac` (JDK 25) syntax pass with no Spring/Lombok on the classpath —
  it reported zero structural/syntax errors, only expected "symbol not found" noise from the
  missing dependencies.
- Spring Boot 4.x changed two things versus the 3.x line that this project already accounts for:
  1. Flyway now requires the `spring-boot-starter-flyway` starter (not just `flyway-core`) for
     auto-configuration to activate — this project uses that starter.
  2. Lombok needs 1.18.40+ for JDK 25 and, since JDK 23, must be registered explicitly as a
     Maven `annotationProcessorPath` (also already configured in `pom.xml`).
- `product/` and `customer/` modules from your original folder tree are not implemented yet —
  this delivery covers `security`, `auth`, `user`, `role`, `permission`, and `company` only,
  matching the tables you provided.
- Soft-delete pattern is used throughout (`active = false`) rather than hard deletes, to preserve
  referential integrity with existing accounting data.
- `X-Company-Id` header + `CompanyContext`/`CompanyAccessService` are wired up and ready for you
  to enforce company-scoping on future modules (invoices, ledgers, etc.) — call
  `companyAccessService.requireActiveCompany()` at the top of any company-scoped service method.
