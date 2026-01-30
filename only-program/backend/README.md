# Only Program - Backend API

API REST para Only Program - Plataforma de protección de enlaces seguros con autenticación JWT, integración con Supabase y envío de emails con Brevo.

## 🚀 Características

- ✅ **Autenticación JWT** con Supabase
- ✅ **Middleware de seguridad** para proteger endpoints
- ✅ **Integración con Brevo** para emails transaccionales
- ✅ **CRUD de enlaces protegidos**
- ✅ **Roles de usuario** (user, admin)
- ✅ **Recuperación de contraseñas**
- ✅ **CORS** configurado para frontend
- ✅ **TypeScript** para type safety

## 📦 Instalación

```bash
cd backend
npm install
```

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Server
PORT=4005
NODE_ENV=development

# Supabase
SUPABASE_URL=tu-url-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_ANON_KEY=tu-anon-key

# JWT
JWT_SECRET=tu-clave-secreta

# Brevo Email
BREVO_API_KEY=tu-api-key-de-brevo
BREVO_SENDER_EMAIL=noreply@onlyprogram.com
BREVO_SENDER_NAME=Only Program

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4005
```

### 2. Configurar Brevo

1. Crea una cuenta en [Brevo](https://app.brevo.com)
2. Ve a **Settings** → **API Keys** →**Create a new API key**
3. Copia la API key al archivo `.env`

### 3. Configurar Supabase

Las claves ya están configuradas en tu `.env`. Asegúrate de que:

- La URL de Supabase sea correcta
- Tengas el `SERVICE_ROLE_KEY` (no el anon key para el backend)

## 🎯 Ejecución

### Modo Desarrollo

```bash
npm run dev
```

El servidor correrá en `http://localhost:4005`

### Producción

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Autenticación (Públicos)

```
POST /api/auth/register
Body: { email, password, name? }
Response: { message, user }

POST /api/auth/forgot-password
Body: { email }
Response: { message }

POST /api/auth/reset-password
Body: { token, newPassword }
Response: { message }
```

### Enlaces (Protegidos con JWT)

Requieren header: `Authorization: Bearer <token>`

```
GET /api/links
Response: { links: SmartLink[] }

POST /api/links
Body: { slug, title?, subtitle?, config, expires_at? }
Response: { link: SmartLink }

PUT /api/links/:id
Body: { title?, subtitle?, config?, is_active? }
Response: { link: SmartLink }

DELETE /api/links/:id
Response: { message }
```

### Pagos (Protegidos)

```
GET /api/payments
Response: { message } // Por implementar
```

### Analytics (Protegidos)

```
GET /api/analytics/overview
Response: { message } // Por implementar
```

### Admin (Requiere rol admin)

```
GET /api/admin/users
Response: { message } // Por implementar
```

### Health Check

```
GET /health
Response: { status, timestamp, environment }
```

## 🔒 Seguridad

### Middleware de Autenticación

El middleware `authenticateToken` verifica:

1. Presencia del token JWT en el header
2. Validez del token con Supabase
3. Estado de suspensión delcuenta
4. Obtiene perfil y rol del usuario

```typescript
// Uso en rutas
import { authenticateToken } from "./middlewares/auth.middleware";

router.get("/protected", authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // ... lógica
});
```

### Middleware de Roles

```typescript
import { requireAdmin } from "./middlewares/auth.middleware";

// Solo admin puede acceder
router.get("/admin-only", authenticateToken, requireAdmin, handler);
```

## 📧 Envío de Emails

### Emails Disponibles

```typescript
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
} from "./services/brevo.service";

// Email de bienvenida
await sendWelcomeEmail("user@example.com", "Nombre Usuario");

// Recuperación de contraseña
await sendPasswordResetEmail("user@example.com", resetToken);

// Alerta de seguridad
await sendSecurityAlertEmail("user@example.com", "link-slug", "razón");
```

## 🗂️ Estructura del Proyecto

```
backend/
├── src/
│   ├── middlewares/
│   │   └── auth.middleware.ts      # JWT y roles
│   ├── routes/
│   │   ├── auth.routes.ts          # Autenticación
│   │   ├── links.routes.ts         # CRUD enlaces
│   │   ├── payments.routes.ts      # Pagos
│   │   ├── analytics.routes.ts     # Analíticas
│   │   └── admin.routes.ts         # Admin
│   ├── services/
│   │   └── brevo.service.ts        # Emails
│   └── app.ts                      # Express app
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## 🧪 Testing

```bash
npm test
```

## 🐛 Debugging

El servidor muestra logs en consola para:

- Requests entrantes
- Errores de autenticación
- Envío de emails
- Errores 500

## 📝 Notas Importantes

- **Service Role Key**: El backend usa el `SERVICE_ROLE_KEY` de Supabase para operaciones administrativas
- **CORS**: Configurado para aceptar requests del frontend (localhost:3000)
- **Tokens JWT**: Supabase maneja los tokens automáticamente, no necesitas crear/firmar JWTs manualmente
- **Brevo**: Los emails tienen templates HTML profesionales con el branding de Only Program

## 🔗 Enlaces Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Brevo](https://developers.brevo.com/)
- [Express.js](https://expressjs.com/)

---

**Desarrollado por Cybercore Systems**
