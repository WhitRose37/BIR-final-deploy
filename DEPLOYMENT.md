# 🚀 คู่มือการ Deploy

## วิธีที่ 1: Deploy ด้วย Vercel (แนะนำ - ฟรี)

### เตรียมโปรเจค

1. **อัปเดต .gitignore**
```bash
# ตรวจสอบว่า .gitignore มีสิ่งเหล่านี้
.env*
!.env.example
prisma/*.db
prisma/*.db-journal
node_modules/
.next/
```

2. **สร้าง Git Repository**
```bash
git init
git add .
git commit -m "Initial commit"
```

3. **Push ขึ้น GitHub**
```bash
# สร้าง repository ใหม่ที่ github.com แล้ว push
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### Setup Database (Vercel Postgres)

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิก **Storage** → **Create Database**
3. เลือก **Postgres** → **Continue**
4. ตั้งชื่อ database → **Create**
5. ไปที่ **.env.local** tab → คัดลอก `DATABASE_URL` และ `DIRECT_URL`

### Deploy บน Vercel

1. ไปที่ [Vercel Dashboard](https://vercel.com/new)
2. **Import Git Repository** → เลือก repo ของคุณ
3. ตั้งค่า Environment Variables:

```
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=0227...
NEXTAUTH_SECRET=generate-random-string-here
```

4. **Deploy**

### รัน Migration และ Seed

หลัง deploy เสร็จ:

```bash
# ตั้งค่า DATABASE_URL เป็น production
export DATABASE_URL="your-vercel-postgres-url"

# รัน migration
npx prisma migrate deploy

# seed admin user
node scripts/seed.mjs
```

---

## วิธีที่ 2: Deploy ด้วย Railway (ฟรี + ง่าย)

1. ไปที่ [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. เลือก repository
4. Railway จะสร้าง Postgres database ให้อัตโนมัติ
5. ตั้ง Environment Variables เหมือนข้างบน
6. Deploy!

---

## วิธีที่ 3: Deploy บน VPS (DigitalOcean, AWS, etc.)

### ติดตั้ง Node.js และ Dependencies

```bash
# SSH เข้า VPS
ssh user@your-server-ip

# ติดตั้ง Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone project
git clone https://github.com/your-username/your-repo.git
cd your-repo

# ติดตั้ง dependencies
npm install

# สร้าง .env
nano .env
# วาง environment variables
```

### ติดตั้ง PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql

# ใน psql:
CREATE DATABASE bir_ai;
CREATE USER bir_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE bir_ai TO bir_user;
\q
```

### Build และรัน

```bash
# Build
npm run build

# รัน migration
npx prisma migrate deploy

# Seed
node scripts/seed.mjs

# รัน production
npm start
```

### ติดตั้ง PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 start npm --name "bir-ai" -- start
pm2 save
pm2 startup
```

### Setup Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL ด้วย Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## การอัปเดต Production

```bash
# บน server
cd your-repo
git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart bir-ai
```

---

## Environment Variables ที่ต้องตั้งใน Production

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DIRECT_URL=postgresql://user:pass@host:5432/dbname
PERPLEXITY_API_KEY=pplx-...
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=...
NEXTAUTH_SECRET=random-secret-min-32-chars
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

---

## ⚠️ Security Checklist

- [ ] เปลี่ยน admin password หลัง deploy
- [ ] ลบไฟล์ `/api/promote-me/route.ts` (endpoint ชั่วคราว)
- [ ] ตั้ง NEXTAUTH_SECRET ใหม่ (ใช้ `openssl rand -base64 32`)
- [ ] ตั้ง rate limiting สำหรับ login endpoint
- [ ] เปิด HTTPS (SSL)
- [ ] Backup database ทุกวัน

---

## 🎯 Quick Start (Vercel - แนะนำ)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add DATABASE_URL
vercel env add PERPLEXITY_API_KEY
# ... ต่อไปตามรายการข้างบน

# 5. Redeploy
vercel --prod
```

---

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ logs: `vercel logs` หรือ `pm2 logs`
2. ตรวจสอบ environment variables
3. ตรวจสอบ database connection

## ที่เก็บข้อมูล (Where data is stored)

- ตรวจสอบการตั้งค่า (เร็ว ๆ):
  - เปิดไฟล์ `.env` และดูค่า `DATABASE_URL` — นี่คือจุดที่แอพจะเชื่อมต่อฐานข้อมูล
  - เปิด `prisma/schema.prisma` และดู `datasource provider` (เช่น `sqlite`, `mysql`, `postgresql`)

- กรณี SQLite (development)
  - DATABASE_URL มักเป็น `file:./dev.db` หรือ `file:./prisma/dev.db`
  - ไฟล์ฐานข้อมูลจริงจะอยู่ในโฟลเดอร์โปรเจกต์ (เช่น `prisma/dev.db`)
  - ตรวจสอบ: `ls prisma` หรือเปิดไฟล์ด้วย SQLite viewer

- กรณี MySQL (local)
  - ฐานข้อมูลอยู่บน MySQL server ที่ระบุใน `DATABASE_URL` (เช่น `mysql://root:pass@localhost:3306/partgen`)
  - ตำแหน่งไฟล์ข้อมูล (local Windows default): `C:\ProgramData\MySQL\MySQL Server 8.0\Data`
  - ตรวจสอบ/เชื่อมต่อ: ใช้ MySQL Workbench หรือ CLI (ถ้าไม่อยู่ใน PATH ให้ใช้ full path ของ `mysql.exe`)
  - ตัวอย่างคำสั่งเช็ค: `mysql -u root -p -e "USE partgen; SHOW TABLES;"`

- กรณี Managed DB (Vercel, Railway, PlanetScale, RDS)
  - ฐานข้อมูลเก็บไว้ในบริการคลาวด์ — ดูรายละเอียดและ credentials ใน dashboard ของบริการนั้น
  - ตัวอย่าง: ใน Vercel จะมี `DATABASE_URL` ที่ชี้ไปยัง Vercel Postgres

- ตารางสำคัญในโปรเจกต์
  - `SavedPartGlobal` — เก็บข้อมูลชิ้นส่วนที่บันทึก (ใช้เป็น proxy ของ "search/save")
  - หากคุณเพิ่ม `SearchLog` หรือโมเดลอื่น ให้ตรวจ schema.prisma เพื่อรู้ตารางที่มี

- เครื่องมือสำหรับตรวจและแก้ไข
  - Prisma Studio: `npx prisma studio` (UI ดู/แก้ตาราง)
  - ตรวจสถานะจากแอพ: `GET /api/db-info` หรือ `GET /api/db-check` (ถ้ามี)
  - Prisma CLI: `npx prisma migrate status`, `npx prisma db pull`
