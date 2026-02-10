## Wizybot IA – Chatbot API (NestJS)

### 1. Overview / Visión general

**EN:**  
This project is a NestJS REST API that exposes a chatbot endpoint backed by the OpenAI Chat Completion API.  
The chatbot can:  
- Call internal tools to **search products** from a CSV catalog.  
- Call an internal tool to **convert currencies** using the Open Exchange Rates API.  
- Expose its endpoints and schemas with **Swagger**.

**ES:**  
Este proyecto es una API REST en NestJS que expone un endpoint de chatbot respaldado por la OpenAI Chat Completion API.  
El chatbot puede:  
- Llamar herramientas internas para **buscar productos** en un catálogo CSV.  
- Llamar una herramienta interna para **convertir divisas** usando la API de Open Exchange Rates.  
- Exponer sus endpoints y esquemas mediante **Swagger**.

---

### 2. Project structure / Estructura del proyecto

Raíz del repositorio:
- `wizybot_ia/` – NestJS backend (main project folder).
- `wizybot_ia/mini-front/` – Static demo front (`index.html` + `styles.css`) to chat with the API from the browser.
- `wizybot_ia/src/chat/` – Chat module (controller, service, DTOs y tipos de OpenAI).
- `wizybot_ia/src/currency/` – Currency module (servicio de conversión de divisas).
- `wizybot_ia/src/products/` – Products module (servicio de lectura/búsqueda en catálogo CSV).

**Main NestJS files / Ficheros principales NestJS**
- `src/main.ts` – Application bootstrap, global validation pipe and Swagger setup.  
- `src/app.module.ts` – Root module, imports `ConfigModule` and `ChatModule`.  
- `src/app.controller.ts` / `src/app.service.ts` – Simple health/hello endpoint.

---

### 3. Requirements / Requisitos

**EN:**
- Node.js >= 18
- npm >= 9
- An OpenAI API key (Chat Completions)
- An Open Exchange Rates API key (for currency conversion)

**ES:**
- Node.js >= 18  
- npm >= 9  
- Una API key de OpenAI (Chat Completions)  
- Una API key de Open Exchange Rates (para conversión de divisas)  

---

### 4. Installation / Instalación

**EN:**
1. Clone this repository and go to the backend folder:
   ```bash
   git clone <your-repo-url> wizybotIA
   cd wizybotIA/wizybot_ia
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

**ES:**
1. Clona este repositorio y ve a la carpeta del backend:
   ```bash
   git clone <tu-url-del-repo> wizybotIA
   cd wizybotIA/wizybot_ia
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

---

### 5. Environment variables / Variables de entorno

Create a `.env` file in `wizybot_ia` (same folder as `package.json`) with:

**EN:**
```bash
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4.1-mini 

OPEN_EXCHANGE_RATES_API_KEY=your_open_exchange_rates_key_here
OPEN_EXCHANGE_RATES_BASE=USD

PORT=3000
```

**ES:**  
Explicación de cada variable:
- `OPENAI_API_KEY`: clave de API de OpenAI para llamar a la Chat Completion API.  
- `OPENAI_MODEL`: nombre del modelo de chat a utilizar (por defecto `gpt-4.1-mini`).  
- `OPEN_EXCHANGE_RATES_API_KEY`: clave para llamar a la API de Open Exchange Rates.  
- `OPEN_EXCHANGE_RATES_BASE`: moneda base usada por Open Exchange Rates (habitualmente `USD`).  
- `PORT`: puerto HTTP donde se levanta la API (por defecto 3000 si no se define).  

---

### 6. Running the app / Ejecutar la aplicación

**Development / Desarrollo**

**EN:**
```bash
cd wizybot_ia
npm run start:dev
```

**ES:**
Modo desarrollo con recarga en caliente:
```bash
cd wizybot_ia
npm run start:dev
```

**Production / Producción**

**EN:**
```bash
cd wizybot_ia
npm run build
npm run start:prod
```

**ES:**
Compila el proyecto y arranca en modo producción:
```bash
cd wizybot_ia
npm run build
npm run start:prod
```

La API quedará disponible en `http://localhost:3000`.

---

### 6.1 Using the demo front (mini-front) / Cómo usar el front de demostración

**EN:**

A static HTML demo lives in `wizybot_ia/mini-front/`. It lets you send messages to the chatbot and see the answer without using Postman or cURL.

1. **Start the backend** (see section 6):
   ```bash
   cd wizybot_ia
   npm run start:prod
   ```
   The API must be running at `http://localhost:3000`.

2. **Open the front** in your browser:
   - Go to the folder `wizybot_ia/mini-front/`.
   - Open `index.html` (double-click or drag it into the browser).
   - Or serve the folder with any static server (e.g. Live Server in VS Code, or `npx serve mini-front` from `wizybot_ia`).

3. **Use the UI:**
   - Click one of the preset questions (e.g. "I am looking for a phone") or type your own in the input.
   - Click **Send**. The chatbot answer appears in the right panel.
   - If you see "Network error", ensure the backend is running and that CORS allows your front origin (e.g. `http://127.0.0.1:5500` if using Live Server); this is already configured in `main.ts`.

4. **Deploying the front:**  
   To use a deployed API, edit `API_BASE_URL` in `mini-front/index.html` and set it to your backend URL (e.g. `https://your-api.onrender.com`). You can then deploy the `mini-front` folder to Vercel or any static host.

**ES:**

El front de demostración está en `wizybot_ia/mini-front/`. Sirve para enviar mensajes al chatbot y ver la respuesta sin usar Postman ni cURL.

1. **Arranca el backend** (ver sección 6) en `http://localhost:3000`.
2. **Abre el front** en el navegador: entra en `wizybot_ia/mini-front/` y abre `index.html`, o sirve esa carpeta con un servidor estático.
3. **Uso:** haz clic en una pregunta predefinida o escribe la tuya, pulsa **Send** y la respuesta aparecerá en el panel derecho.
4. **En producción:** cambia `API_BASE_URL` en `mini-front/index.html` por la URL de tu API desplegada y despliega la carpeta `mini-front` en Vercel u otro host estático.

---

### 6.2 Deploying to Vercel (backend + front) / Desplegar en Vercel (API + front)

**EN:**

You can deploy both the NestJS API and the static front in a single Vercel project.

1. **From the repo root** (or from `wizybot_ia` if the repo root is the backend):
   - Connect the repo to Vercel. If the repo root is the monorepo root, set **Root Directory** to `wizybot_ia` in the Vercel project settings.
   - Add environment variables in Vercel: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPEN_EXCHANGE_RATES_API_KEY`, `OPEN_EXCHANGE_RATES_BASE` (and optionally `PORT`; not required for serverless).

2. **Build and deploy:**
   - The project has a `vercel.json` that runs `npm run build` and then `node scripts/copy-public.js` to build Nest and copy the mini-front into `public`.
   - Static files in `public` (the demo front) are served at `/`. The API runs as a serverless function under `/api` (e.g. `POST /api/chat`).
   - The copied `index.html` is patched so `API_BASE_URL` is `/api`, so the front calls the same Vercel deployment.

3. **After deployment:** open `https://your-project.vercel.app/` to use the chat UI; the backend is at `https://your-project.vercel.app/api/chat`. Swagger is at `https://your-project.vercel.app/api/api` (Nest is mounted under `/api`, and Swagger is at `/api` inside Nest).

**ES:**

Puedes desplegar la API NestJS y el front estático en un solo proyecto de Vercel.

1. Conecta el repositorio a Vercel. Si la raíz del repo es la del monorepo, en el proyecto de Vercel configura **Root Directory** en `wizybot_ia`.
2. Añade en Vercel las variables de entorno: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPEN_EXCHANGE_RATES_API_KEY`, `OPEN_EXCHANGE_RATES_BASE`.
3. Al desplegar, se ejecuta el build de Nest y se copia el mini-front a `public`. La web queda en `/` y la API en `/api` (p. ej. `POST /api/chat`).
4. Abre `https://tu-proyecto.vercel.app/` para usar el chat; la API está en `https://tu-proyecto.vercel.app/api/chat`.

---

### 7. API documentation (Swagger) / Documentación de la API (Swagger)

**EN:**
- Once the app is running, open:  
  `http://localhost:3000/api`
  - You will see the Swagger UI.
  - All controllers, DTOs and responses are documented there.

**ES:**
- Cuando la app esté en ejecución, abre:  
  `http://localhost:3000/api`
  - Verás la interfaz de Swagger.  
  - Ahí se documentan los controladores, DTOs y respuestas.  

Swagger is configured in `src/main.ts` using `DocumentBuilder`, `SwaggerModule.createDocument` and `SwaggerModule.setup('api', ...)`.

---

### 8. Chat endpoint / Endpoint de chatbot

**Route / Ruta**
- `POST /chat`

**Request body (DTO: `ChatRequestDto`)**

```json
{
  "message": "I am looking for an iPhone"
}
```

**Response (simplified)**

```json
{
  "answer": "AI-generated answer with product suggestions, currency conversions, etc."
}
```

**EN (flow):**
1. `ChatController` receives the request and validates it using `ChatRequestDto` and Nest validation pipes.
2. It calls `ChatService.chatWithBot(message)`.
3. `ChatService` calls the OpenAI Chat Completion API with **tools**:
   - `searchProducts` – calls the internal `ProductsService`.
   - `convertCurrencies` – calls the internal `CurrencyService`.
4. If the model requests one of these tools, `ChatService` executes it locally and sends the result back to OpenAI in a second call, so the model can generate a final answer.

**ES (flujo):**
1. `ChatController` recibe la petición y la valida usando `ChatRequestDto` y los pipes de validación globales.  
2. Llama a `ChatService.chatWithBot(message)`.  
3. `ChatService` llama a la OpenAI Chat Completion API con **tools**:
   - `searchProducts` – llama al `ProductsService` interno.  
   - `convertCurrencies` – llama al `CurrencyService` interno.  
4. Si el modelo solicita alguna de estas tools, `ChatService` la ejecuta localmente y envía el resultado a OpenAI en una segunda llamada, para que el modelo genere la respuesta final.  

---

### 9. Internal services / Servicios internos

#### 9.1 ChatService (`src/chat/chatService.ts`)

**EN:**
- Holds the main chatbot business logic.
- Reads configuration from `ConfigService` (`OPENAI_API_KEY`, `OPENAI_MODEL`).
- Calls the OpenAI Chat Completion API:
  - First call with the user message and the tool definitions.
  - Executes the requested tool (if any) via `runTool`.
  - Second call including the tool result so the model can produce the final assistant message.
- Maps OpenAI / Axios errors to NestJS HTTP exceptions (`BadRequestException`, `ServiceUnavailableException`, `InternalServerErrorException`).
- Uses strongly typed interfaces in `src/chat/openai.types.ts` for the OpenAI responses.

**ES:**
- Contiene la lógica de negocio principal del chatbot.  
- Lee configuración desde `ConfigService` (`OPENAI_API_KEY`, `OPENAI_MODEL`).  
- Llama a la OpenAI Chat Completion API:
  - Primera llamada con el mensaje del usuario y la definición de las tools.  
  - Ejecuta la tool solicitada (si existe) mediante `runTool`.  
  - Segunda llamada incluyendo el resultado de la tool para que el modelo genere el mensaje final.  
- Mapea errores de OpenAI / Axios a excepciones HTTP de Nest (`BadRequestException`, `ServiceUnavailableException`, `InternalServerErrorException`).  
- Usa interfaces tipadas en `src/chat/openai.types.ts` para las respuestas de OpenAI.  

#### 9.2 CurrencyService (`src/currency/currency.service.ts`)

**EN:**
- Uses `ConfigService` to read `OPEN_EXCHANGE_RATES_API_KEY` and `OPEN_EXCHANGE_RATES_BASE`.
- Calls the Open Exchange Rates REST API to fetch latest exchange rates.
- Exposes a `convert(amount, from, to)` method used by the chatbot tool `convertCurrencies`.
- Validates the amount and throws `BadRequestException` for invalid input or unsupported currencies.

**ES:**
- Usa `ConfigService` para leer `OPEN_EXCHANGE_RATES_API_KEY` y `OPEN_EXCHANGE_RATES_BASE`.  
- Llama a la API REST de Open Exchange Rates para obtener los tipos de cambio.  
- Expone un método `convert(amount, from, to)` usado por la tool `convertCurrencies` del chatbot.  
- Valida el importe y lanza `BadRequestException` cuando la entrada no es válida o la divisa no está soportada.  

#### 9.3 ProductsService (`src/products/products.service.ts`)

**EN:**
- Loads a CSV file `products_list.csv` from `src/data/` on startup.
- Parses the CSV into an in-memory array of `Product` objects.
- Exposes `search(query: string)`:
  - Performs a basic scoring based on title and description matches.
  - Returns at most 2 relevant products.
- Used by the OpenAI tool `searchProducts`.

**ES:**
- Carga el fichero CSV `products_list.csv` desde `src/data/` al iniciar la aplicación.  
- Parsea el CSV en un array en memoria de objetos `Product`.  
- Expone `search(query: string)`:
  - Realiza un sistema de puntuación básico usando coincidencias en título y descripción.  
  - Devuelve como máximo 2 productos relevantes.  
- Es usado por la tool de OpenAI `searchProducts`.  

---

### 10. Testing the API / Probar la API

#### 10.1 Using cURL / Usando cURL

**EN:**
```bash
curl -X POST http://localhost:3000/chat ^
  -H "Content-Type: application/json" ^
  -d "{ \"message\": \"I am looking for a cheap phone\" }"
```

**ES:**
- Ejecuta el comando anterior en PowerShell o adapta la sintaxis a tu terminal.  
- Deberías recibir un JSON con un campo `answer` generado por el modelo.  

#### 10.2 Using Postman / Insomnia

**EN:**
- Method: `POST`
- URL: `http://localhost:3000/chat`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "message": "I am looking for a cheap phone"
  }
  ```

**ES:**
- Método: `POST`  
- URL: `http://localhost:3000/chat`  
- Cabeceras: `Content-Type: application/json`  
- Cuerpo (JSON): igual que el ejemplo anterior.  

---

Yhonier Arias. 