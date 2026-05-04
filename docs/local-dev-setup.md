# 로컬 개발 환경 셋업 가이드

운영(Vercel)에 배포된 데이터로 로컬에서 개발·테스트하기 위한 절차.

- 운영 DB: **Prisma Postgres** (`db.prisma.io:5432`, PostgreSQL 17 호환)
- 로컬 DB: **PostgreSQL 17** (Homebrew 설치, `localhost:5432`)
- 동기화 방식: `pg_dump` → `psql` 한 번 실행으로 운영 데이터 그대로 복제

---

## 0. 사전 준비물

- macOS + Homebrew
- Node.js (`nvm` 권장, 현재 v24.x 검증)
- Vercel 계정 접근 (운영 환경 변수를 받을 권한)

---

## 1. Vercel CLI 연결 + 환경 변수 가져오기

```bash
npm i -g vercel
vercel login                                    # 브라우저 인증
vercel link                                     # 기존 'finance-analysis-nextjs' 프로젝트와 연결
                                                #   → .vercel/project.json 생성 (gitignored)
vercel env pull .env.local --environment=production
                                                #   → DATABASE_URL, POSTGRES_URL, API 키들 등 다운로드
```

`.env.local`은 `.gitignore`에 의해 자동 제외되므로 커밋되지 않는다. GitHub ↔ Vercel 자동 배포 연결은 `vercel link`로 영향받지 않는다.

---

## 2. PostgreSQL 17 설치 + 실행

운영 DB가 Postgres 17.x이므로 **반드시 17 버전**을 깐다 (16으로는 `pg_dump`가 버전 미스매치로 실패).

```bash
brew install postgresql@17
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"   # 영구화는 ~/.zshrc에
pg_isready -h localhost -p 5432                            # ready 메시지 확인
```

기존에 `postgresql@16`이 동작 중이면 포트 충돌이 나므로 먼저 정지: `brew services stop postgresql@16`.

---

## 3. 로컬 DB / 유저 생성

```bash
createdb fa_db
psql -d fa_db -c "CREATE USER fa_user WITH PASSWORD 'fa_pass' SUPERUSER;"
psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" -c "SELECT current_database();"
```

비밀번호는 로컬 전용이라 단순값(`fa_pass`)을 그대로 쓴다. 운영 DB와는 별개 자격증명이다.

---

## 4. 의존성 설치 + 마이그레이션 적용

```bash
npm ci
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
DIRECT_DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  node_modules/.bin/prisma migrate deploy
```

`prisma/migrations/` 의 마이그레이션이 모두 적용되어 빈 스키마가 만들어진다.

> Prisma 7로 글로벌 업그레이드된 환경에서는 `npx prisma`가 7.x를 잡아 schema validation에서 실패할 수 있다. **반드시 `node_modules/.bin/prisma`** 로 호출.

---

## 5. 운영 데이터 → 로컬 DB로 복제

```bash
set -a; source .env.local; set +a              # POSTGRES_URL을 셸로 로드 (운영 TCP 직결 URL)

pg_dump --data-only --no-owner --no-acl --disable-triggers \
  "$POSTGRES_URL" > /tmp/prod-data.sql

# 마이그레이션 적용 시 자동 추가된 _prisma_migrations 행을 비워 PK 충돌 방지
psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  -c "TRUNCATE _prisma_migrations;"

psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  -v ON_ERROR_STOP=1 -f /tmp/prod-data.sql
```

검증:
```bash
psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" -c \
  "SELECT 'companies' AS t, count(*) FROM companies
   UNION ALL SELECT 'analyses', count(*) FROM analyses
   UNION ALL SELECT 'financial_statements', count(*) FROM financial_statements
   UNION ALL SELECT 'valuations', count(*) FROM valuations;"
```

---

## 6. `.env.local`의 DB URL을 로컬용으로 덮어쓰기

`vercel env pull`이 채워준 `DATABASE_URL`/`DIRECT_DATABASE_URL`은 운영 DB를 가리킨다. 그대로 두면 `npm run dev`가 운영을 직접 두드려 quota를 소진하고 위험하다. 두 줄만 로컬값으로 교체:

```env
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db"
DIRECT_DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db"
```

`POSTGRES_URL`, `PRISMA_DATABASE_URL`은 코드에서 참조하지 않으므로 그대로 둔다 (다음 동기화 때 `pg_dump` 인자로 다시 사용).

---

## 7. 개발 서버 실행

```bash
npm run dev          # 기본 3000번
PORT=3030 npm run dev   # 다른 프로젝트가 3000을 점유 중이면 다른 포트로
```

`.env.local`이 `.env`보다 우선 로드되므로 자동으로 로컬 DB를 본다 (`Environments: .env.local, .env` 로그로 확인 가능).

검증:
```bash
curl -s http://localhost:3030/api/companies | head -c 500
curl -s http://localhost:3030/api/config
```

---

## 일상 운영

### 운영 데이터 재동기화 (운영 DB가 갱신된 후)

```bash
set -a; source .env.local; set +a
pg_dump --data-only --no-owner --no-acl --disable-triggers \
  "$POSTGRES_URL" > /tmp/prod-data.sql

psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" -c \
  "TRUNCATE companies, analyses, financial_statements, valuations, _prisma_migrations CASCADE;"

psql "postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  -v ON_ERROR_STOP=1 -f /tmp/prod-data.sql
```

### Postgres 서비스 관리

```bash
brew services list | grep postgres
brew services stop postgresql@17
brew services start postgresql@17
brew services restart postgresql@17
```

데이터 디렉토리: `/opt/homebrew/var/postgresql@17`.

### Prisma Studio (DB GUI)

```bash
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  node_modules/.bin/prisma studio
```

### 스키마 변경이 운영에 들어간 경우

운영 DB 스키마와 로컬이 어긋나면 `pg_dump`/`restore`도 깨진다. 새 마이그레이션이 main에 머지된 직후라면:

```bash
git pull
npm ci
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
DIRECT_DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" \
  node_modules/.bin/prisma migrate deploy
# 그 다음 위 "운영 데이터 재동기화" 실행
```

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| `pg_dump: 서버 버전이 일치하지 않아 중단` | 로컬 Postgres가 16 이하. `brew install postgresql@17` 필수 |
| `Unable to acquire lock at .next/dev/lock` | 직전 dev 프로세스가 비정상 종료. `pkill -f "next dev"` 후 `rm -f .next/dev/lock` |
| `EADDRINUSE: address already in use :::3000` | 다른 Next.js 프로젝트 점유 중. `PORT=3030 npm run dev`로 회피 |
| `Error code: P1012 ... url is no longer supported` | 글로벌 `prisma@7`이 잡힘. 반드시 `node_modules/.bin/prisma` 사용 |
| 데이터 import 시 PK 중복 | `_prisma_migrations` 테이블에 마이그레이션 행이 이미 존재. 5단계의 `TRUNCATE _prisma_migrations` 누락 |
| `npm run dev`가 운영 DB를 보고 있음 | 6단계의 `.env.local` DB URL 덮어쓰기 누락. `Environments: .env.local, .env` 순서 확인 |

---

## 보안 주의사항

- `.env.local`에는 운영 API 키들(Anthropic, OpenAI, DART 등)이 평문으로 들어간다. **외부에 공유 / 커밋 / 백업 금지**.
- `.gitignore`에 `.env*.local` 등재 확인 필수 (현재 OK).
- `vercel env pull` 직후 항상 6단계의 DB URL 교체를 진행해, 로컬 dev가 운영 DB를 직접 두드리지 않도록 한다.
