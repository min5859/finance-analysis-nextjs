# Financial Analysis Dashboard

DART(전자공시) 재무데이터를 AI로 분석하고, 12개 슬라이드 대시보드로 시각화하는 웹 애플리케이션.

## 기술 스택

- **프론트엔드**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **상태 관리**: Zustand 5 (sessionStorage persist)
- **차트**: Chart.js + react-chartjs-2
- **AI**: Anthropic Claude, OpenAI, Gemini, DeepSeek (멀티 프로바이더)
- **데이터베이스**: PostgreSQL 16 + Prisma 6 ORM
- **로컬 DB**: Docker Compose

---

## 로컬 개발 환경 설정

### 사전 준비

- [Node.js](https://nodejs.org/) 20 이상
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (DB용)

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 API 키를 입력합니다:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db"
```

### 3. 데이터베이스 시작

```bash
docker compose up -d
```

이 명령은 Docker 컨테이너 안에 PostgreSQL 데이터베이스를 시작합니다.

### 4. 테이블 생성 (마이그레이션)

```bash
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" npx prisma migrate dev
```

> Prisma CLI는 `.env.local`을 읽지 못하므로 `DATABASE_URL`을 앞에 붙여야 합니다.

### 5. 앱 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인.

---

## Docker와 데이터베이스 개념 안내

### Docker란?

Docker는 프로그램을 **격리된 컨테이너** 안에서 실행하는 도구입니다.
PostgreSQL을 직접 설치하지 않고, Docker가 대신 실행해 줍니다.

```
┌─ 내 PC ──────────────────────────────────┐
│                                           │
│  ┌─ Docker 컨테이너 ──────────────────┐  │
│  │  PostgreSQL 16                     │  │
│  │  (fa_db 데이터베이스)               │  │
│  └────────────────────────────────────┘  │
│          ↕ localhost:5432                 │
│  ┌────────────────────────────────────┐  │
│  │  Next.js 앱 (localhost:3000)       │  │
│  └────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
```

### 데이터는 어디에 저장되나요?

Docker Volume이라는 별도 공간에 저장됩니다.
컨테이너를 중지하거나 삭제해도 데이터는 유지됩니다.

```
Docker Volume (frontend_pgdata)  ← 데이터가 여기에 저장됨
  └── 컨테이너와 독립적으로 존재
```

### 기존 JSON 파일 방식과 차이

**이전**: 재무 데이터를 JSON 파일로 저장

```
src/data/companies/
  ├── 삼성전자.json      ← 파일 하나에 모든 데이터
  └── 한솔케미칼.json
```

**현재**: PostgreSQL 데이터베이스에 저장

```
companies 테이블            ← 기업 기본 정보 (이름, 섹터)
analyses 테이블             ← AI 분석 결과 (JSON 데이터 포함)
financial_statements 테이블 ← 재무제표 원본
valuations 테이블           ← 밸류에이션 결과
```

JSON 파일의 내용은 `analyses` 테이블의 `financial_data` 컬럼에 그대로 들어가 있습니다.

### 마이그레이션 vs 시드

| | 마이그레이션 (`prisma migrate dev`) | 시드 (`npm run db:seed`) |
|---|---|---|
| 하는 일 | 빈 테이블(구조)을 만듦 | 테이블에 데이터를 넣음 |
| 비유 | 엑셀에서 열 이름 지정 | 엑셀에 실제 데이터 입력 |
| 언제 실행 | 처음 설정할 때, 스키마 변경 시 | 초기 데이터가 필요할 때 |

---

## 자주 쓰는 명령어

### 앱 실행

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |

### 데이터베이스

| 명령 | 설명 |
|------|------|
| `docker compose up -d` | PostgreSQL 시작 |
| `docker compose stop` | PostgreSQL 중지 (데이터 유지) |
| `docker compose down` | 컨테이너 삭제 (데이터 유지) |
| `docker compose down -v` | 컨테이너 + 데이터 모두 삭제 |
| `npm run db:migrate` | 테이블 생성/변경 |
| `npm run db:seed` | 기존 JSON 데이터를 DB에 입력 |
| `npm run db:reset` | DB 초기화 (테이블 재생성 + 시드) |

### 데이터 확인

```bash
# 브라우저에서 DB 데이터 확인 (localhost:5555)
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db" npx prisma studio

# 터미널에서 SQL 직접 실행
docker exec -it frontend-db-1 psql -U fa_user -d fa_db
```

---

## Docker 권한 문제 (WSL2)

Docker 명령에서 `permission denied` 에러가 나면:

```bash
# 1회 실행 (WSL 재시작 시 다시 필요)
sudo chmod 666 /var/run/docker.sock
```

또는 영구 해결:

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 환경변수 목록

| 변수 | 설명 | 필수 |
|------|------|:----:|
| `ANTHROPIC_API_KEY` | Claude API 키 | O |
| `OPENAI_API_KEY` | OpenAI API 키 | - |
| `GEMINI_API_KEY` | Gemini API 키 | - |
| `DEEPSEEK_API_KEY` | DeepSeek API 키 | - |
| `CLAUDE_MODEL` | Claude 모델명 (기본: claude-sonnet-4-20250514) | - |
| `OPENAI_MODEL` | OpenAI 모델명 (기본: gpt-4o) | - |
| `GEMINI_MODEL` | Gemini 모델명 (기본: gemini-2.0-flash) | - |
| `DEEPSEEK_MODEL` | DeepSeek 모델명 (기본: deepseek-chat) | - |
| `DATABASE_URL` | PostgreSQL 접속 주소 | O |

---

## 클라우드 DB 사용하기

로컬 Docker 대신 클라우드 DB를 사용하면 어디서든 같은 데이터에 접속할 수 있습니다.
**코드 변경 없이 `DATABASE_URL`만 바꾸면 됩니다.**

### DATABASE_URL 형식

```
DATABASE_URL="postgresql://유저명:비밀번호@호스트:포트/DB이름"
```

```
예시:
로컬 Docker  → postgresql://fa_user:fa_pass@localhost:5432/fa_db
Google Cloud → postgresql://fa_user:비밀번호@34.xx.xx.xx:5432/fa_db
AWS          → postgresql://fa_user:비밀번호@xxx.rds.amazonaws.com:5432/fa_db
Supabase     → postgresql://postgres.xxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 클라우드 DB 비교

| 서비스 | 무료 티어 | 설정 난이도 | 특징 |
|--------|:---------:|:----------:|------|
| **Supabase** | 500MB | 쉬움 | 가입만 하면 바로 사용 가능 |
| **Neon** | 512MB | 쉬움 | 서버리스 PostgreSQL, 자동 스케일 |
| **Google Cloud SQL** | 없음 (~$7/월) | 보통 | gcloud CLI 필요 |
| **AWS RDS** | 12개월 무료 | 보통 | AWS 콘솔에서 생성 |

---

### 방법 1: Supabase (가장 쉬움, 무료)

가입하면 바로 PostgreSQL DB가 제공됩니다. 설치할 것이 없습니다.

**1단계: 프로젝트 생성**
1. https://supabase.com 에 가입
2. "New Project" 클릭
3. DB 비밀번호 설정, Region: `Northeast Asia (Seoul)` 선택

**2단계: 접속 정보 복사**
1. Project Settings > Database > Connection string > URI 복사

**3단계: .env.local 수정**
```
DATABASE_URL="postgresql://postgres.xxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

**4단계: 테이블 생성**
```bash
DATABASE_URL="위의_URL" npx prisma migrate deploy
```

> `migrate deploy`는 운영 환경용 명령입니다 (로컬의 `migrate dev`와 달리 확인 없이 실행).

---

### 방법 2: Neon (무료, 서버리스)

Supabase와 비슷하게 가입만 하면 됩니다.

**1단계: 프로젝트 생성**
1. https://neon.tech 에 가입
2. "Create Project" 클릭
3. Region: `Asia Pacific (Singapore)` 선택

**2단계: 접속 정보 복사**
1. Dashboard에서 Connection string 복사

**3단계: .env.local 수정**
```
DATABASE_URL="postgresql://유저명:비밀번호@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

**4단계: 테이블 생성**
```bash
DATABASE_URL="위의_URL" npx prisma migrate deploy
```

---

### 방법 3: Google Cloud SQL

GCP 계정과 gcloud CLI가 필요합니다.

**1단계: Cloud SQL 인스턴스 생성**
```bash
# gcloud CLI 설치 후
gcloud sql instances create fa-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-northeast3

gcloud sql databases create fa_db --instance=fa-db
gcloud sql users set-password postgres --instance=fa-db --password=YOUR_PASSWORD
```

**2단계: 접속 허용**
```bash
# 내 IP에서 접속 허용
gcloud sql instances patch fa-db --authorized-networks=$(curl -s ifconfig.me)/32
```

**3단계: .env.local 수정**
```bash
# 외부 IP 확인
gcloud sql instances describe fa-db --format="value(ipAddresses[0].ipAddress)"
```
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@외부IP:5432/fa_db"
```

**4단계: 테이블 생성**
```bash
DATABASE_URL="위의_URL" npx prisma migrate deploy
```

---

### 방법 4: AWS RDS

AWS 계정이 필요합니다. 12개월 무료 티어(db.t3.micro) 제공.

**1단계: RDS 인스턴스 생성**
1. AWS Console > RDS > "Create database"
2. PostgreSQL 16 선택
3. Free tier 템플릿 선택
4. DB instance: `fa-db`, Master username: `fa_user`, Password 설정
5. Public access: Yes (개발용)

**2단계: 보안그룹 설정**
1. VPC Security Group에서 Inbound rule 추가
2. Type: PostgreSQL (5432), Source: My IP

**3단계: .env.local 수정**
```
DATABASE_URL="postgresql://fa_user:비밀번호@fa-db.xxxx.ap-northeast-2.rds.amazonaws.com:5432/fa_db"
```

**4단계: 테이블 생성**
```bash
DATABASE_URL="위의_URL" npx prisma migrate deploy
```

---

### 클라우드 DB로 전환한 후

Docker는 더 이상 필요 없습니다:

```bash
# 로컬 Docker DB 중지
docker compose down
```

앱은 `DATABASE_URL`이 가리키는 곳에서 데이터를 읽고 씁니다.
로컬이든 클라우드든 앱 코드는 동일합니다.

---

## Vercel + 클라우드 DB 배포

Vercel은 서버리스 환경이라 Docker를 실행할 수 없습니다.
따라서 외부 DB 서비스를 연결해야 합니다.

```
┌─ Vercel ──────────────┐       ┌─ Supabase/Neon ───────┐
│  Next.js 앱           │──────→│  PostgreSQL DB        │
│  (서버리스)            │ 인터넷 │  (서울 리전)           │
└───────────────────────┘       └───────────────────────┘
  DATABASE_URL 환경변수로 연결
```

### 설정 순서

**1단계: 클라우드 DB 생성**

위의 [클라우드 DB 사용하기](#클라우드-db-사용하기) 섹션에서 하나를 선택하여 DB를 생성합니다.
Supabase 또는 Neon이 무료이고 가장 간단합니다.

**2단계: 로컬에서 테이블 생성**

```bash
DATABASE_URL="클라우드_DB_URL" npx prisma migrate deploy
```

**3단계: Vercel에 환경변수 추가**

1. [Vercel Dashboard](https://vercel.com) > 프로젝트 선택
2. Settings > Environment Variables
3. 아래 변수 추가:

| Name | Value | Environment |
|------|-------|:-----------:|
| `DATABASE_URL` | 클라우드 DB 접속 URL | Production, Preview, Development 모두 체크 |

> 기존에 설정한 `ANTHROPIC_API_KEY` 등의 환경변수는 그대로 유지합니다.

**4단계: 재배포**

환경변수 추가 후 재배포가 필요합니다:

```bash
# CLI로 재배포
vercel --prod

# 또는 git push하면 자동 재배포
git push
```

**5단계: 확인**

Vercel 배포 URL에서 앱이 정상 동작하는지 확인합니다.
사이드바에 기업 목록이 표시되면 DB 연결 성공입니다.

### 로컬 개발과 Vercel 배포를 동시에 사용하기

로컬과 Vercel이 같은 DB를 바라보게 할 수 있습니다:

```
# .env.local (로컬 개발용)
DATABASE_URL="postgresql://postgres.xxx:비밀번호@...supabase.com:6543/postgres"

# Vercel 환경변수 (배포용)
DATABASE_URL="postgresql://postgres.xxx:비밀번호@...supabase.com:6543/postgres"  ← 같은 URL
```

이렇게 하면 로컬에서 추가한 데이터가 Vercel 배포 사이트에서도 보입니다.

반대로 로컬과 배포를 분리하려면 서로 다른 DB를 사용하면 됩니다:

```
# .env.local (로컬 개발용)
DATABASE_URL="postgresql://fa_user:fa_pass@localhost:5432/fa_db"  ← 로컬 Docker

# Vercel 환경변수 (배포용)
DATABASE_URL="postgresql://postgres.xxx:비밀번호@...supabase.com:6543/postgres"  ← 클라우드
```
