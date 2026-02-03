# Only Program - Aplicación Web

## 📋 Resumen del Proyecto

Aplicación web profesional para **Only Program**, una plataforma de protección de enlaces seguros para creadores de contenido, desarrollada con React, TypeScript, Tailwind CSS y Supabase.

## ✨ Características Implementadas

### 🎨 Diseño y UX

- ✅ Diseño dark mode profesional con tema personalizado
- ✅ Animaciones suaves y microinteracciones
- ✅ Efectos glassmorphism y gradientes dinámicos
- ✅ Responsive design completo
- ✅ Logo integrado en navbar y footer

### 🔐 Autenticación

- ✅ Login con email/password usando Supabase Auth
- ✅ OAuth con Google
- ✅ Hook personalizado `useAuth` para gestión de estado
- ✅ Protección de rutas y redirección

### 🧩 Componentes

- ✅ **Navbar**: Navegación con logo, menú y botones de autenticación
- ✅ **Footer**: Enlaces, newsletter y branding
- ✅ **Home**: Landing page con hero, features, testimonios y más
- ✅ **Login**: Página de inicio de sesión completa

### 🎯 Animaciones Profesionales

- `fade-in`: Aparición suave de elementos
- `slide-up`: Deslizamiento hacia arriba
- `pulse-glow`: Efecto de brillo pulsante
- Transiciones hover en tarjetas y botones
- Scroll suave entre secciones

## 🚀 Cómo Ejecutar

### 1. Instalar Dependencias

```bash
cd apps/web
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en `apps/web/` basado en `.env.example`:

```env
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
apps/web/
├── src/
│   ├── assets/
│   │   └── logo.png                 # Logo de Only Program
│   ├── components/
│   │   ├── Navbar.tsx               # Barra de navegación
│   │   └── Footer.tsx               # Pie de página
│   ├── hooks/
│   │   └── useAuth.ts               # Hook de autenticación
│   ├── pages/
│   │   ├── Home.tsx                 # Página principal
│   │   └── Login.tsx                # Página de login
│   ├── services/
│   │   └── supabase.ts             # Cliente y tipos de Supabase
│   ├── styles/
│   │   └── index.css               # Estilos globales y Tailwind
│   ├── App.tsx                     # Configuración de rutas
│   └── main.tsx                    # Punto de entrada
├── index.html
├── package.json
├── tailwind.config.js              # Configuración de Tailwind
├── vite.config.ts                  # Configuración de Vite
└── tsconfig.json                   # Configuración de TypeScript
```

## 🔗 Integración con Supabase

### Configuración de Google OAuth en Supabase

1. Ve a tu proyecto de Supabase
2. Navega a **Authentication** > **Providers**
3. Habilita **Google** y configura:
   - **Client ID** de Google Cloud Console
   - **Client Secret** de Google Cloud Console
   - **Redirect URL**: Añade la URL de tu aplicación

### Tablas de Base de Datos

El proyecto está configurado para trabajar con las siguientes tablas:

- `profiles`: Perfiles de usuario
- `smart_links`: Enlaces protegidos
- `subscriptions`: Suscripciones de usuarios
- `plans`: Planes de pago
- `payments`: Historial de pagos
- `link_analytics_daily`: Analíticas diarias
- `link_events`: Eventos de enlaces

## 🎨 Personalización de Tema

Los colores y estilos están definidos en `tailwind.config.js`:

```javascript
colors: {
  primary: '#1DA1F2',
  'primary-dark': '#1E90FF',
  secondary: '#6FD6FF',
  'background-dark': '#0B0B0B',
  surface: '#161616',
  border: '#2A2A2A',
  silver: '#C9CCD1',
  cyan: '#00E5FF',
}
```

## 📦 Dependencias Principales

- **React 18**: Framework UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **Supabase**: Backend y autenticación
- **React Router**: Enrutamiento

## 🔜 Próximos Pasos

- [ ] Implementar dashboard de usuario
- [ ] Crear generador de enlaces
- [ ] Agregar analíticas en tiempo real
- [ ] Implementar sistema de pagos
- [ ] Crear página de registro
- [ ] Añadir recuperación de contraseña

## 💡 Notas Importantes

- El logo se encuentra en `src/assets/logo.png`
- Las fuentes Google (Inter y JetBrains Mono) se cargan desde CDN
- Los iconos Material Symbols se cargan desde Google Fonts
- El proyecto usa el modo oscuro por defecto

---

**Desarrollado con ❤️ para Only Program**
