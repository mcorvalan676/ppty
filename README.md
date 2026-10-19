# PPTY Publishing Studio

Aplicación web para explorar publicaciones y administrar contenido, construida con React y Vite.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Desarrollo

```sh
npm install
npm run dev
```

Para generar y previsualizar la versión de producción:

```sh
npm run build
npm run preview
```

## Administración

En la primera visita, abre **Acceder** para crear la cuenta de administrador principal. Define un usuario, una contraseña segura y un código 2FA propios. No hay credenciales predeterminadas en el código.

**Importante:** esta aplicación de demostración guarda las cuentas, contraseñas, sesiones y publicaciones en `localStorage` del navegador. No proporciona autenticación segura para producción: usa un backend con autenticación y almacenamiento protegidos antes de manejar datos reales.
