# Confirmación de Gestión Negocio

Página pública independiente de la aplicación. No contiene el código de la app ni claves secretas.

## Publicar
GitHub Settings → Pages → Source: Deploy from a branch → rama principal, carpeta /(root) → Save.

Esperar la publicación y comprobar el enlace mostrado por GitHub Pages antes de cambiar Supabase.

## Supabase
En el proyecto Gestión Negocio, Authentication → URL Configuration: usar el nuevo enlace de GitHub Pages como Site URL y agregarlo en Redirect URLs. Conservar temporalmente el enlace anterior mientras se prueba con un nuevo correo de registro. No configurar comodines para localhost.

La página funciona con el correo predeterminado de Supabase; no necesita SMTP personalizado. Comprueba el usuario con Supabase antes de mostrar éxito y quita los tokens de la barra de direcciones. Los tokens no se guardan en almacenamiento local.

## Pruebas
`node --test tests/confirmation.test.mjs`

## Alcance
Esta página confirma correos de registro. No permite cambiar la contraseña. La recuperación de contraseña de Android requiere un flujo propio y no debe dirigirse a esta página como solución final.

Solo poner el repositorio de la aplicación en privado después de probar el nuevo enlace de confirmación e inicio de sesión en Android.
