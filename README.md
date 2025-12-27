# Save My Wallet Web

Interfaz construida con Next.js 16 y Tailwind 4 para consumir la API de Save My Wallet.

## Flujo de autenticación

- Las páginas `/login` y `/register` usan React Query 5 y Axios para llamar a `/api/v3/auth/login` y `/api/v3/auth/register`.
- El cliente Axios se configura con la variable `NEXT_PUBLIC_API_BASE_URL` (por defecto `http://localhost:8000`).
- El resultado de la API se transforma con `parseUserFromApi` para convertir los campos snake_case a camelCase antes de guardar el usuario y los tokens en el contexto de autenticación.
- Al autenticarse se redirige automáticamente a `/dashboard`, donde se da la bienvenida y se puede cerrar sesión.

## Variables de entorno

Crea un archivo `.env.local` con, al menos:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Desarrollo local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Ejecuta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

- `npm run dev` — arranca el servidor de desarrollo.
- `npm run build` — compila la app para producción.
- `npm run lint` — ejecuta ESLint sobre el proyecto.
