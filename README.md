# EBAC Social

Clone funcional do X/Twitter com API REST em Django e interface React responsiva. O projeto implementa cadastro e login seguros, perfis editáveis, rede de seguidores, feed personalizado, publicações, curtidas e comentários.

## Funcionalidades

- Cadastro, login, logout e autenticação via token
- Perfil com nome, bio, foto por URL e troca opcional de senha
- Busca de usuários, seguir/deixar de seguir e listas de seguidores/seguidos
- Feed contendo exclusivamente posts das pessoas seguidas
- CRUD de posts com limite de 280 caracteres e autorização por autor
- Curtidas e comentários em tempo real
- API paginada, CORS configurável e painel administrativo Django
- Testes automatizados com pytest e factory-boy
- PostgreSQL Neon em produção e SQLite apenas como fallback local

## Estrutura

```text
ebac_social/
├── backend/       # Django REST Framework + Poetry
├── frontend/      # React + Vite
└── render.yaml    # Blueprint de deploy da solução completa
```

## Execução local

Requisitos: Python 3.13+, Poetry 2+, Node 20+ e npm.

### API

```bash
cd backend
copy .env.example .env
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

Por padrão, o desenvolvimento usa SQLite. Para usar Neon também localmente, defina `DATABASE_URL` com a URL fornecida em **Neon > Connect**, preservando `sslmode=require`.

### Frontend

Em outro terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`. A API estará em `http://localhost:8000/api/`.

## Execução com Docker Compose

Com Docker Desktop em execução, suba toda a aplicação — frontend, API e
PostgreSQL — com um único comando na raiz do projeto:

```bash
docker compose up --build
```

- Aplicação: `http://localhost:5173`
- API: `http://localhost:8000/api/`
- Health check: `http://localhost:8000/health/`
- PostgreSQL: `localhost:5432`

Os dados locais ficam preservados no volume `postgres_data`. Para parar os
containers, execute `docker compose down`. O comando não remove o banco; use
`docker compose down -v` somente quando quiser apagar também os dados locais.

## Testes e build

```bash
cd backend
poetry run pytest

cd ../frontend
npm run build
```

## Endpoints principais

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register/` | Criar conta |
| POST | `/api/auth/login/` | Entrar e obter token |
| GET/PATCH | `/api/profile/` | Ver ou editar o próprio perfil |
| GET | `/api/users/` | Listar ou buscar usuários (`?search=`) |
| POST | `/api/users/{id}/follow/` | Seguir/deixar de seguir |
| GET | `/api/posts/feed/` | Feed de pessoas seguidas |
| GET/POST | `/api/posts/` | Listar/criar posts |
| PATCH/DELETE | `/api/posts/{id}/` | Editar/excluir post próprio |
| POST | `/api/posts/{id}/like/` | Curtir/descurtir |
| POST | `/api/posts/{id}/comments/` | Comentar |

Envie `Authorization: Token SEU_TOKEN` nos endpoints protegidos.

## Neon e deploy no Render

1. Crie um projeto gratuito no [Neon](https://neon.tech), copie sua connection string pooled e mantenha `sslmode=require`.
2. Envie esta pasta a um repositório GitHub.
3. No Render, escolha **New > Blueprint**, conecte o repositório e selecione `render.yaml`.
4. Informe `DATABASE_URL` quando solicitado. Se os nomes/domínios gerados forem diferentes, ajuste `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e `VITE_API_URL` no painel.
5. Aguarde os dois serviços ficarem verdes e teste `/health/` na API.

O `entrypoint.sh` executa migrações e coleta de arquivos estáticos a cada deploy. Os nomes públicos sugeridos pelo blueprint são `https://ebac-social.onrender.com` e `https://ebac-social-api.onrender.com`; a disponibilidade desses nomes depende do Render.

O `docker-compose.yml` é destinado ao desenvolvimento local. O Render não faz
deploy diretamente por Docker Compose: ele usa o `render.yaml`, construindo o
backend pelo `backend/Dockerfile` e o frontend como Static Site.

Se o serviço de API tiver sido criado manualmente em vez de pelo Blueprint,
deixe **Root Directory** vazio, configure **Dockerfile Path** como
`./Dockerfile` e **Docker Build Context Directory** como `.`. No Blueprint
esses caminhos já estão declarados explicitamente.

> O link definitivo só existe após conectar as contas Neon, GitHub e Render. Nenhum segredo deve ser versionado.
