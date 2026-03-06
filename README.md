# Parcial Chinook Store

Aplicación full-stack para búsqueda y compra de canciones sobre la base Chinook, con backend FastAPI, frontend React y pipeline CI/CD en GitHub Actions.

## Arquitectura en AWS (objetivo de despliegue)

- **Frontend (EC2 público)**: sirve el build de React (Nginx o Node static server).
- **Backend (EC2 privado o público restringido)**: FastAPI (Uvicorn + systemd), expone API REST.
- **RDS PostgreSQL privado (obligatorio)**:
  - `PubliclyAccessible = false`.
  - Security Group de RDS permite tráfico solo desde el Security Group del backend.
  - No se expone Internet Gateway directo a la base de datos.
- **CI/CD (GitHub Actions)**:
  - Ejecuta pruebas backend + frontend en cada push.
  - Si pasan y la rama es `main`, despliega automáticamente a EC2 frontend y backend por SSH y reinicia servicios.

## Requerimientos funcionales implementados

- Búsqueda de canciones por:
  - Nombre de canción.
  - Artista.
  - Género.
- Registro de compra de canción:
  - Selección de cliente.
  - Selección de canción por ID.
  - Inserción de `invoice` e `invoice_line`.
- Validación frontend y backend.
- Alertas de éxito/error en UI.

## Estructura

- `backend/`: API FastAPI, servicios y pruebas PyTest.
- `frontend/`: aplicación React + Vitest/RTL.
- `db/Chinook.sql`: script oficial Chinook (PostgreSQL).
- `.github/workflows/ci-cd.yml`: pipeline CI/CD.

## Configuración local

### 1) Base de datos Chinook

> Usa PostgreSQL local o RDS privada y carga `db/Chinook.sql`.

```bash
psql -h <host> -U <usuario> -d postgres -f db/Chinook.sql
```

### 2) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://chinook:chinook@localhost:5432/chinook"
uvicorn main:app --reload --port 8000
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Config opcional:

```bash
export VITE_API_URL="http://localhost:8000/api"
```

## Pruebas

### Backend

```bash
cd backend
pytest -q
```

### Frontend

```bash
cd frontend
npm run test
```

## Variables para CI/CD

Configura estos secrets en GitHub:

- `BACKEND_EC2_HOST`
- `BACKEND_EC2_USER`
- `BACKEND_EC2_SSH_KEY`
- `FRONTEND_EC2_HOST`
- `FRONTEND_EC2_USER`
- `FRONTEND_EC2_SSH_KEY`

Y ajusta rutas remotas en `.github/workflows/ci-cd.yml` según tu servidor.
