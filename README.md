# 📚 Guía completa: Sistema de reservas con packs de clases

## Arquitectura del sistema

```
/
├── src/app/
│   ├── page.tsx                     → Página principal (cal.com embed + cards de packs)
│   ├── pago-exitoso/page.tsx        → Confirmación tras pago en Stripe
│   ├── reservar/page.tsx            → Calendario + gestión de créditos
│   └── api/
│       ├── credits/route.ts         → GET ?email= → devuelve créditos
│       ├── book/route.ts            → POST → descuenta 1 crédito
│       └── stripe/
│           ├── checkout/route.ts    → POST → crea sesión de pago
│           └── webhook/route.ts     → POST ← Stripe → añade créditos en Sheet
├── src/components/
│   └── PackModal.tsx                → Modal nombre+email (como cal.com)
└── src/lib/
    └── sheets.ts                    → Utilidades Google Sheets API
```

---

## PASO 1 — Crear la cuenta en Stripe

1. Ve a **https://stripe.com** y crea tu cuenta.
2. En el **Dashboard**, activa tu cuenta con datos bancarios reales.
3. Ve a **Developers → API Keys**. Copia:
   - `Publishable key` (empieza por `pk_live_...`)
   - `Secret key` (empieza por `sk_live_...`)
4. Ve a **Products → Add product**:
   - Crea **"Pack 5 clases"** con precio fijo (ej: €75 → precio único)
   - Crea **"Pack 10 clases"** con precio fijo (ej: €140 → precio único)
   - Copia los **Price IDs** de cada producto (empiezan por `price_...`)
5. Pon los precios en `.env.local`.

> ⚠️ Para pruebas usa las claves `pk_test_` y `sk_test_`.  
> Para producción usa las claves `pk_live_` y `sk_live_`.

---

## PASO 2 — Configurar Google Sheets

### 2a. Crear la hoja de cálculo

1. Ve a **https://sheets.google.com** y crea una hoja nueva.
2. Llámala **"Alumnos de Gustavo"** o similar.
3. En la pestaña `Hoja1`, renómbrala a **`Alumnos`**.
4. En la fila 1, crea estos encabezados:

| A | B | C | D | E |
|---|---|---|---|---|
| email | name | credits | pack_purchased | last_updated |

5. Copia el **ID de la hoja** desde la URL:
   `https://docs.google.com/spreadsheets/d/**ID_AQUI**/edit`

### 2b. Crear Service Account en Google Cloud

1. Ve a **https://console.cloud.google.com**
2. Crea un proyecto nuevo (o usa uno existente).
3. Activa la **Google Sheets API**:
   - Busca "Sheets API" → Enable
4. Ve a **IAM & Admin → Service Accounts → Create Service Account**:
   - Nombre: `teacher-booking`
   - Rol: **Editor** (o Basic → Editor)
5. Entra a la service account → **Keys → Add Key → JSON** → descarga el archivo.
6. Del JSON descargado, copia:
   - `client_email` → va a `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → va a `GOOGLE_PRIVATE_KEY`

### 2c. Compartir la hoja con la Service Account

1. Abre la hoja de Google Sheets.
2. Pulsa **Compartir**.
3. Añade el email de la service account (ej: `teacher-booking@mi-proyecto.iam.gserviceaccount.com`).
4. Dale permisos de **Editor**.

---

## PASO 3 — Configurar Google Calendar (Appointment Scheduling)

1. Ve a **https://calendar.google.com**.
2. Crea una nueva **página de citas** (Appointment Scheduling):
   - Ajustes → "Páginas de citas" → Nueva página
   - Configura tus **horarios disponibles** (ej: lunes a viernes 10-20h)
   - Duración de cada cita: **1 hora**
3. Copia el **Scheduling URL** (algo como `/appointments/schedules/XXXX`).
4. El `CALENDAR_ID` para el embed es la parte `XXXX` de esa URL.
5. Pon ese valor en `NEXT_PUBLIC_GOOGLE_CALENDAR_ID`.

---

## PASO 4 — Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PACK5=price_...
STRIPE_PRICE_ID_PACK10=price_...

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1BxiMVs0XRA5...

# Google Calendar (parte final de la URL de citas)
NEXT_PUBLIC_GOOGLE_CALENDAR_ID=AKFv...

# Cal.com
NEXT_PUBLIC_CAL_URL=https://cal.com/gustavo-torres

# URL base
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> ⚠️ **Importante con `GOOGLE_PRIVATE_KEY`**: La clave privada tiene saltos de línea reales.  
> En `.env.local` escríbelos como `\n` literales entre comillas dobles.

---

## PASO 5 — Instalar y ejecutar en local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

### Probar el webhook de Stripe en local

Instala la CLI de Stripe:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows: descarga desde https://github.com/stripe/stripe-cli/releases
```

Ejecuta el listener:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copia el `whsec_...` que te muestra y ponlo en `STRIPE_WEBHOOK_SECRET`.

---

## PASO 6 — Desplegar en Vercel

1. Sube el código a **GitHub** (sin el `.env.local`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/teacher-booking.git
   git push -u origin main
   ```

2. Ve a **https://vercel.com** → Import Project → selecciona el repo.

3. En la configuración del proyecto, añade **todas las variables de entorno**:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID_PACK5`
   - `STRIPE_PRICE_ID_PACK10`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
   - `NEXT_PUBLIC_GOOGLE_CALENDAR_ID`
   - `NEXT_PUBLIC_CAL_URL`
   - `NEXT_PUBLIC_BASE_URL` → tu URL de Vercel (ej: `https://teacher-booking.vercel.app`)

4. Haz click en **Deploy**.

### Configurar el webhook de Stripe en producción

1. Ve a **Stripe Dashboard → Developers → Webhooks → Add endpoint**.
2. URL: `https://tu-app.vercel.app/api/stripe/webhook`
3. Eventos: selecciona `checkout.session.completed`
4. Copia el **Signing secret** (`whsec_...`) y actualiza la variable en Vercel.

---

## Flujo completo del alumno

```
1. Alumno entra a tu web
   ↓
2. Ve el embed de cal.com (reservas individuales) Y los 2 cards de packs
   ↓
3. Hace click en "Comprar Pack 5" (o Pack 10)
   ↓
4. Se abre modal → introduce nombre y email
   ↓
5. Sistema comprueba: ¿tiene créditos ya?
   ├── SÍ → va directo a /reservar (sin pagar)
   └── NO → redirige a Stripe Checkout
              ↓
           Alumno paga con tarjeta
              ↓
           Stripe llama a /api/stripe/webhook
              ↓
           Se añaden N créditos en Google Sheet
              ↓
           Alumno llega a /pago-exitoso
              ↓
6. En /reservar:
   - Ve su nombre + créditos disponibles
   - Ve Google Calendar embed con huecos libres
   - Elige un hueco
   - Pulsa "Confirmar reserva"
   - Sistema descuenta 1 crédito en Google Sheet
   ↓
7. Puede repetir el paso 6 hasta agotar créditos
   ↓
8. Sin créditos → botón "Comprar otro pack"
```

---

## Precios sugeridos (personaliza en page.tsx)

| Pack | Precio | Por clase | Ahorro vs individual (€16) |
|------|--------|-----------|---------------------------|
| Pack 5 | €75 | €15 | €5 |
| Pack 10 | €140 | €14 | €20 |

Para cambiar los precios, edita `src/app/page.tsx` (las cards) y actualiza los Price IDs de Stripe.

---

## Personalización adicional

### Cambiar colores
El proyecto usa Tailwind. El color principal es `indigo-600`. Puedes cambiarlo a cualquier color de Tailwind buscando y reemplazando `indigo` por `blue`, `violet`, `emerald`, etc.

### Añadir notas adicionales en el modal
En `PackModal.tsx` añade un campo `<textarea>` igual que lo tienes en cal.com.

### Caducidad de packs
Si en el futuro quieres añadir caducidad, agrega una columna `expires_at` en Google Sheets y comprueba la fecha en `getCredits()`.

---

## Solución de problemas frecuentes

**El webhook no funciona en local**
→ Asegúrate de tener `stripe listen --forward-to localhost:3000/api/stripe/webhook` corriendo.

**Error de Google Sheets: "invalid_grant"**
→ Comprueba que `GOOGLE_PRIVATE_KEY` tiene los `\n` correctamente. Debería verse así en el archivo JSON: `"-----BEGIN RSA PRIVATE KEY-----\nXXX\n-----END RSA PRIVATE KEY-----\n"`

**El calendario de Google no aparece**
→ El `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` debe ser la parte final de tu URL de "Appointment Scheduling", no el email del calendario.

**Stripe no redirige correctamente**
→ Verifica que `NEXT_PUBLIC_BASE_URL` no tiene barra final y coincide exactamente con tu URL de Vercel.
