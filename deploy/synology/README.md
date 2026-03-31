# Synology NAS (Container Manager)

## Один образ: сайт + PostgreSQL

У **`home-crm:latest`** всередині одного контейнера: **Alpine PostgreSQL** (лише `127.0.0.1:5432` усередині контейнера) і **Next.js**. Зовні відкритий лише **порт 3000** (або `APP_PORT`). Дані БД тримаються в томі **`postgres_data`** → **`/var/lib/postgresql/data`**.

## Збірка на ПК → імпорт у DSM

У **корені проєкту**:

```powershell
npm run docker:export
```

Або (обов’язково той самий секрет, що в `.env` для `NEXTAUTH_SECRET`):

```powershell
docker build -t home-crm:latest --build-arg AUTH_SECRET=ВСТАВ_З_ТВОГО_ENV .
docker save home-crm:latest -o home-crm-latest.tar
```

**Чому:** middleware шифрує/дешифрує JWT під час `next build`. Якщо збірка була без `AUTH_SECRET`, а в контейнері секрет є — буде `JWTSessionError: no matching decryption secret`. Команда **`npm run docker:export`** збирає через `docker compose` і підставляє `NEXTAUTH_SECRET` з `.env` у build-arg.

1. Скопіюй **`home-crm-latest.tar`** на NAS.
2. **Container Manager** → **Image** → **Import** → тег **`home-crm:latest`**.

Під час **запуску** задаєш у **`.env`** / UI: `DB_PASSWORD`, `NEXTAUTH_*`, Google тощо. Рядок **`NEXTAUTH_SECRET`** (і **`AUTH_SECRET`** — той самий текст) має **збігатися** з тим, що був при **`docker compose build`** / `npm run docker:export`, інакше сесійні cookie не розшифруються.

## Що потрібно на NAS

- **`docker-compose.synology.yml`**, **`.env`** у одній папці (наприклад `/volume1/docker/home-crm/`).
- У **Project** вказати цей compose — піднімається **один** сервіс **`app`** (контейнер **`homecrm`**).

## Змінні середовища

| Змінна | Опис |
|--------|------|
| **`DB_PASSWORD`** | **Обов’язково.** Пароль користувача БД `homecrm` всередині контейнера. |
| **`NEXTAUTH_SECRET`** | Секрет для сесії (наприклад `openssl rand -base64 32`). Має збігатися з секретом **на етапі збірки** образу. |
| **`AUTH_SECRET`** | У `.env` постав **то саме значення**, що й `NEXTAUTH_SECRET` (Auth.js v5). |
| **`NEXTAUTH_URL`** | **Обов’язково** публічна URL, наприклад `https://bostonleek.space` (без шляху в кінці). Якщо тут `localhost`, а сайт відкривають з домену — Auth.js дає **`UntrustedHost`** і браузер показує **забагато редіректів**. У коді ввімкнено `trustHost`, але URL у змінних мають відповідати реальному домену. |
| `AUTH_URL` | За бажанням те саме, що `NEXTAUTH_URL` (Auth.js v5). |
| `NEXT_PUBLIC_APP_URL` | Зазвичай те саме, що `NEXTAUTH_URL`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth; redirect `https://…/api/auth/callback/google`. |

Опційно: `AUTH_ALLOWED_EMAILS`, `APP_PORT`.

**`DATABASE_URL` задавати не потрібно** — entrypoint сам збирає підключення до локального Postgres. Якщо в `.env` лишився `DATABASE_URL` з ПК — для цього образу його можна прибрати або не експортувати в контейнер (не заважає, якщо не перевизначає логіку; entrypoint виставляє свій URL для Prisma).

## Томи

- **`postgres_data`** — файли PostgreSQL (бекапь цей том).
- **`recipe_uploads`** — `public/uploads` (фото рецептів).

## Оновлення

Новий `.tar` → Import → перезапуск проєкту.

```sh
cd /volume1/docker/home-crm
docker compose -f docker-compose.synology.yml up -d
```

## Google OAuth

**Authorized JavaScript origins** і **redirect URIs** — саме та адреса, з якої відкриваєш сайт.
