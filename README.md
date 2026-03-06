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
- `frontend/`: aplicación React.
- `db/Chinook.sql`: script oficial Chinook (PostgreSQL).
- `.github/workflows/ci-cd.yml`: pipeline CI/CD.

## Cómo iniciar TODO y verlo corriendo (local)

### Opción recomendada (3 terminales)

### Terminal 1: Base de datos (Docker)

```bash
docker compose up -d db
```

> Esto levanta PostgreSQL y carga automáticamente `db/Chinook.sql` la **primera vez** que se crea el volumen.

Para verificar que está arriba:

```bash
docker ps
```

Si necesitas reinicializar datos desde cero:

```bash
docker compose down -v
docker compose up -d db
```

### Terminal 2: Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://chinook:chinookpass@localhost:5432/chinook"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Prueba rápida del backend:

```bash
curl http://localhost:8000/health
```

### Terminal 3: Frontend (React)

```bash
cd frontend
npm install
export VITE_API_URL="http://localhost:8000/api"
npm run dev -- --host 0.0.0.0 --port 5173
```

Abre en navegador:

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

---

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
