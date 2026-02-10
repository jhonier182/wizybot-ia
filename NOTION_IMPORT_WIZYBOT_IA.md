# Wizybot IA – Documentación del proyecto para Notion

Este documento describe el proyecto completo: qué hace el código, cómo está estructurado, qué soluciones se implementaron y cómo funciona cada función y algoritmo, con muestras de código. Puedes importarlo en Notion (Import → Markdown).

---

## 1. Visión general del proyecto

**Qué es:** API REST en NestJS que expone un chatbot respaldado por la **OpenAI Chat Completion API** (no Agent API). El chatbot puede usar dos herramientas (function calling):

1. **searchProducts** – Busca en un catálogo de productos (CSV) y devuelve hasta 2 productos relevantes.
2. **convertCurrencies** – Convierte una cantidad de una moneda a otra usando la API de **Open Exchange Rates**.

**Flujo resumido:** El usuario envía un mensaje → Nest recibe en `POST /chat` → se llama a OpenAI con las tools definidas → si el modelo pide una tool, se ejecuta en el backend (ProductsService o CurrencyService) → se hace una segunda llamada a OpenAI con el resultado → se devuelve la respuesta final en texto.

---

## 2. Estructura del proyecto

```
wizybot_ia/
├── src/
│   ├── main.ts                 # Punto de entrada, levanta la app
│   ├── app-bootstrap.ts        # Crea la app Nest, CORS, Swagger, ValidationPipe
│   ├── app.module.ts           # Módulo raíz (ConfigModule, ChatModule)
│   ├── app.controller.ts       # GET / (health/hello)
│   ├── app.service.ts          # Lógica del hello
│   ├── chat/                   # Módulo del chatbot
│   │   ├── chatModule.ts
│   │   ├── chatController.ts    # POST /chat
│   │   ├── chatService.ts      # Orquesta OpenAI + tools
│   │   ├── chat-request.dto.ts
│   │   ├── chat-tools.types.ts # Tipos de args/result de las tools
│   │   └── openai.types.ts    # Tipos de la API OpenAI
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.service.ts # Lectura CSV + búsqueda
│   │   └── product.interface.ts
│   ├── currency/
│   │   ├── currency.module.ts
│   │   └── currency.service.ts # Open Exchange Rates
│   └── data/
│       └── products_list.csv   # Catálogo de productos
├── mini-front/
│   ├── index.html              # UI de chat (presets + input + respuesta)
│   └── styles.css
├── .env                        # OPENAI_API_KEY, OPEN_EXCHANGE_RATES_API_KEY, etc.
└── package.json
```

---

## 3. Entrada de la aplicación y bootstrap

### 3.1 `main.ts` – Punto de entrada

Solo delega en `createApp()` y escucha en el puerto configurado (por defecto 3000).

```typescript
import '@nestjs/core';
import { createApp } from './app-bootstrap';

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 3.2 `app-bootstrap.ts` – Configuración de la app

**Qué hace:**

- Crea la aplicación Nest con `AppModule`.
- Habilita CORS para orígenes permitidos (localhost, 127.0.0.1:5500, Vercel, etc.).
- Configura **Swagger** en la ruta `/api` (título "Wizybot IA", descripción, versión 1.0).
- Añade **ValidationPipe** global con `whitelist: true` para validar DTOs y quitar propiedades no declaradas.

**Código relevante:**

```typescript
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://wizybot-ia-iibp.vercel.app',
    /\.vercel\.app$/,
  ];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Wizybot IA')
    .setDescription('API for the chatbot Wizybot IA')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  return app;
}
```

---

## 4. Módulo raíz y rutas básicas

### 4.1 `app.module.ts`

Importa `ConfigModule` (global) y `ChatModule`. Los controladores son `AppController` y los definidos en `ChatModule`.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 4.2 `app.controller.ts` – GET /

Devuelve un mensaje de bienvenida (por ejemplo "Hello World!" desde `AppService`). Sirve como health/root.

```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

---

## 5. Módulo Chat: endpoint y orquestación

### 5.1 `chatModule.ts`

Importa `ProductsModule` y `CurrencyModule` para poder inyectar `ProductsService` y `CurrencyService` en `ChatService`. Declara el controlador y el servicio del chat.

```typescript
@Module({
  imports: [ProductsModule, CurrencyModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
```

### 5.2 `chat-request.dto.ts` – Entrada del endpoint

DTO con un único campo `message`, validado con `class-validator` y documentado con Swagger.

```typescript
export class ChatRequestDto {
  @ApiProperty({
    description: 'The message to send to the chatbot',
    example: 'I am looking for iphone ',
  })
  @IsString()
  @MinLength(1)
  message: string;
}
```

### 5.3 `chatController.ts` – POST /chat

Recibe el body como `ChatRequestDto`, llama a `ChatService.chatWithBot(body.message)` y devuelve `{ answer: string }`.

```typescript
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  @ApiBody({ type: ChatRequestDto })
  @ApiOkResponse({ description: 'Chatbot response', type: ChatResponse })
  async createChat(@Body() body: ChatRequestDto): Promise<ChatResponse> {
    const answer = await this.chatService.chatWithBot(body.message);
    return { answer };
  }
}
```

---

## 6. ChatService: flujo con OpenAI y tools

`ChatService` es el núcleo: hace la primera llamada a OpenAI con tools, ejecuta la tool indicada en el backend y hace la segunda llamada con el resultado.

### 6.1 Algoritmo general (`chatWithBot`)

1. Llamar a `callOpenAIWithTools(message)` (primera petición a OpenAI con `tools` y `tool_choice: 'auto'`).
2. Si la respuesta no trae `tool_calls`, devolver directamente `message.content`.
3. Si trae `tool_calls`, tomar la primera:
   - Ejecutar `runTool(toolCall.function.name, toolCall.function.arguments)`.
   - Llamar a `callOpenAIWithToolResult(...)` con el mensaje del usuario, el mensaje del asistente con el tool_call y el resultado de la tool (segunda petición).
4. Devolver `choices[0].message.content` de esa segunda respuesta.
5. En caso de error: si es Axios y hay `response.status`, mapear 429 → ServiceUnavailableException, 4xx → BadRequestException, 5xx → ServiceUnavailableException; si no, InternalServerErrorException.

### 6.2 Primera llamada: `callOpenAIWithTools(userMessage)`

- **Qué hace:** Envía a `https://api.openai.com/v1/chat/completions` un mensaje de sistema (instrucciones de asistente de compras) y el mensaje del usuario. Incluye la definición de las dos tools:
  - **searchProducts**: parámetro `query` (string).
  - **convertCurrencies**: parámetros `amount` (number), `fromCurrency` (string), `toCurrency` (string).
- **Respuesta:** El modelo puede devolver texto directo o una o más `tool_calls` con `name` y `arguments` (JSON string).

Fragmento de la definición de tools:

```typescript
tools: [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Search for products related to the user query in the products catalog.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '...' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'convertCurrencies',
      description: 'Convert an amount of money from one currency to another.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: '...' },
          fromCurrency: { type: 'string', description: '...' },
          toCurrency: { type: 'string', description: '...' },
        },
        required: ['amount', 'fromCurrency', 'toCurrency'],
      },
    },
  },
],
tool_choice: 'auto',
```

### 6.3 Ejecución de tools: `runTool(toolName, rawArgs)`

- Parsea `rawArgs` con `JSON.parse`.
- Si `toolName === 'searchProducts'`: usa `ProductsService.search(args.query)` y mapea cada producto al formato esperado por el LLM (title, description, url, imageUrl, discount, price, variants, createDate).
- Si `toolName === 'convertCurrencies'`: usa `CurrencyService.convert(amount, fromCurrency, toCurrency)` y devuelve `{ fromCurrency, toCurrency, originalAmount, convertedAmount }`.
- Si el nombre no es ninguno de los dos, lanza error.

```typescript
if (toolName === 'searchProducts') {
  const { query } = args as SearchProductsArgs;
  const products = this.productsService.search(query);
  return products.map((p) => ({
    title: p.displayTitle,
    description: p.embeddingText,
    url: p.url,
    imageUrl: p.imageUrl,
    discount: p.discount,
    price: p.price,
    variants: p.variants,
    createDate: p.createDate,
  }));
}
if (toolName === 'convertCurrencies') {
  const { amount, fromCurrency, toCurrency } = args as ConvertCurrenciesArgs;
  const convertedAmount = await this.currencyService.convert(amount, fromCurrency, toCurrency);
  return { fromCurrency, toCurrency, originalAmount: amount, convertedAmount };
}
```

### 6.4 Segunda llamada: `callOpenAIWithToolResult(...)`

- Construye un mensaje de rol `tool` con `tool_call_id`, `name` de la función y `content: JSON.stringify(toolResult)`.
- Envía a la misma API de chat completions los mensajes: sistema, usuario, mensaje del asistente que contenía el tool_call, y el mensaje `tool` con el resultado.
- El modelo genera la respuesta final en lenguaje natural a partir de ese contexto.

---

## 7. ProductsService: catálogo CSV y búsqueda

### 7.1 Responsabilidad

- Cargar `src/data/products_list.csv` en memoria al arrancar.
- Exponer `search(query: string)` que devuelve **hasta 2 productos** más relevantes para la consulta.

### 7.2 Interfaz `Product` (`product.interface.ts`)

```typescript
export interface Product {
  displayTitle: string;
  embeddingText: string;
  url: string;
  imageUrl: string;
  productType: string;
  discount: number;
  price: string;
  variants: string;
  createDate: string;
}
```

Coincide con las columnas del CSV: displayTitle, embeddingText, url, imageUrl, productType, discount, price, variants, createDate.

### 7.3 Carga del CSV: `loadProducts()` y `parseCsvLine`

- **loadProducts:** Lee el archivo con `fs.readFileSync` desde `process.cwd() + 'src/data/products_list.csv'`. Divide por líneas, ignora la primera (cabecera) y parsea cada línea con `parseCsvLine`.
- **parseCsvLine:** Usa `simpleCsvSplit(line)` para obtener los valores (respetando comillas dobles) y rellena un objeto `Product`; si hay menos de 9 valores, devuelve `null`.

### 7.4 `simpleCsvSplit(line)` – Parser CSV sencillo

Recorre la línea carácter a carácter. Si está dentro de comillas dobles, no considera la coma como separador. Fuera de comillas, cada coma separa un campo. Así se pueden tener títulos con comas dentro de las comillas.

```typescript
private simpleCsvSplit(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.length > 0) result.push(current.trim());
  return result;
}
```

### 7.5 Algoritmo de búsqueda: `search(query)`

Objetivo: para consultas como "I am looking for a present for my dad" o "phone", devolver 2 productos relevantes sin depender de la frase exacta.

**Pasos:**

1. **Stopwords:** Se filtran palabras que no aportan (e.g. "i", "am", "looking", "for", "my", "the").
2. **Expansión de sinónimos:** Se amplía la lista de términos a buscar, por ejemplo:
   - dad → men, mens, men's, man, boys, father  
   - present → gift  
   - watch → reloj, watch  
   - phone → iphone, celulares, phone  
   Así "present for my dad" genera términos como gift, men, mens, men's, etc.
3. **Normalización de la query:** Minúsculas, reemplazo de caracteres no alfanuméricos (excepto apóstrofe) por espacio, split por espacios, filtro por longitud > 1 y que no sea stopword.
4. **Puntuación por palabra:** Para cada producto se mira título, descripción y tipo. Para cada término de búsqueda:
   - Si el término aparece como **palabra completa** en el título: +2 puntos.
   - Si aparece como palabra completa en descripción o tipo: +1 punto.  
   Se usa **límite de palabra** (`\b` en regex) para que "men" no coincida dentro de "women".
5. **Ordenar y recortar:** Se filtran productos con puntuación > 0, se ordenan por puntuación descendente y se toman los 2 primeros. Si no hay ninguno con puntuación > 0, se devuelven los 2 primeros del catálogo como fallback.

**Código del matcher por palabra y del scoring:**

```typescript
const wordBoundaryMatch = (text: string, term: string): boolean => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
};

const scored = this.products.map((p) => {
  const title = p.displayTitle.toLowerCase();
  const desc = p.embeddingText.toLowerCase();
  const type = (p.productType || '').toLowerCase();
  let score = 0;
  for (const term of searchTerms) {
    if (wordBoundaryMatch(title, term)) score += 2;
    else if (wordBoundaryMatch(desc, term) || wordBoundaryMatch(type, term)) score += 1;
  }
  return { product: p, score };
});
return scored
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 2)
  .map((s) => s.product);
```

**Soluciones aplicadas aquí:**

- Búsqueda por palabras y sinónimos para consultas naturales ("present for my dad", "phone", "watch").
- Word-boundary para no matchear "men" dentro de "women".
- Fallback a 2 productos si no hay coincidencias, para que el LLM siempre reciba algo.

---

## 8. CurrencyService: conversión de divisas

### 8.1 Responsabilidad

Dado un monto y dos códigos ISO (origen y destino), devolver el monto convertido usando tipos de cambio de **Open Exchange Rates** (base USD).

### 8.2 Método `convert(amount, from, to)`

- Valida que `amount` sea un número positivo; si no, lanza `BadRequestException`.
- Convierte `from` y `to` a mayúsculas.
- Hace GET a `https://openexchangerates.org/api/latest.json?app_id=...&base=USD`.
- Obtiene `rates` (objeto código → tasa respecto a USD).
- Si `from` o `to` no están en `rates`, lanza `BadRequestException`.
- Fórmula:  
  `amountInBase = amount / rates[fromCode]` (pasar de moneda origen a USD),  
  `converted = amountInBase * rates[toCode]` (pasar de USD a moneda destino).
- Redondea a 2 decimales y devuelve el número.
- Cualquier otro error (red, API) se traduce en `InternalServerErrorException`, manteniendo `BadRequestException` si ya se lanzó.

```typescript
const amountInBase = amount / rates[fromCode];   // FROM → USD
const converted = amountInBase * rates[toCode];  // USD → TO
return Number(converted.toFixed(2));
```

---

## 9. Tipos utilizados

### 9.1 `openai.types.ts` – Respuesta de OpenAI

- `OpenAIToolCall`: id, type 'function', function.name, function.arguments.
- `OpenAIChatMessage`: role, content, tool_calls opcional.
- `OpenAIChatCompletion`: choices[].message con content o tool_calls.

### 9.2 `chat-tools.types.ts` – Args y resultados de las tools

- `SearchProductsArgs`: { query: string }.
- `ConvertCurrenciesArgs`: { amount, fromCurrency, toCurrency }.
- `SearchProductsResultItem`: título, descripción, url, imageUrl, discount, price, variants, createDate.
- `ConvertCurrenciesResult`: fromCurrency, toCurrency, originalAmount, convertedAmount.
- `ToolResult`: array de ítems de búsqueda o resultado de conversión.

---

## 10. Frontend (mini-front)

### 10.1 Ubicación y uso

- `mini-front/index.html` y `mini-front/styles.css`.
- Se puede abrir por ejemplo en `http://127.0.0.1:5500/wizybot_ia/mini-front/index.html` (Live Server u otro servidor estático).

### 10.2 Lógica de la URL del chat

- Si existe `window.API_BASE_URL`, se usa.
- Si no, y el hostname es `localhost` o `127.0.0.1`, se usa `http://localhost:3000`.
- En caso contrario se usa `https://wizybot-backend.vercel.app`.
- La URL del chat es `base + '/chat'`.

Así, al probar en local, el front llama al backend Nest en el puerto 3000 sin configurar nada más.

### 10.3 Flujo en la página

- El usuario escribe o elige una pregunta predefinida (chips).
- Al enviar, se hace `fetch(__CHAT_URL, { method: 'POST', body: JSON.stringify({ message }) })`.
- La respuesta se espera como `{ answer: string }`. El contenido se interpreta como Markdown (por ejemplo con `marked`) y se sanitiza (por ejemplo con DOMPurify) antes de mostrarlo en "2. Chatbot answer".

---

## 11. Resumen de soluciones implementadas

| Problema | Solución |
|----------|----------|
| Chatbot que use herramientas sin Agent API | OpenAI Chat Completions con `tools` y `tool_choice: 'auto'`; primera llamada → ejecutar tool local → segunda llamada con resultado. |
| Búsqueda de productos para frases naturales | Stopwords, expansión de sinónimos (dad→men/mens, present→gift, etc.), puntuación por palabra en título/descripción/tipo, límite de palabra para no matchear "men" en "women". |
| Catálogo en CSV con comas dentro de campos | Parser CSV que respeta comillas dobles (`simpleCsvSplit`). |
| Ruta del CSV en desarrollo vs compilado | Uso de `process.cwd() + 'src/data/products_list.csv'` para desarrollo. |
| Conversión de divisas | Open Exchange Rates (base USD): amount/rates[from] * rates[to], redondeo a 2 decimales. |
| Errores de OpenAI (429, 4xx, 5xx) | Detección con `axios.isAxiosError` y mapeo a excepciones HTTP de Nest (ServiceUnavailable, BadRequest). |
| Validación de entrada | DTO con `class-validator` y `ValidationPipe` global. |
| Documentación de la API | Swagger en `/api` con DocumentBuilder y decoradores en el controlador y DTO. |
| Front en local que llame al backend local | Detección de hostname localhost/127.0.0.1 para usar `http://localhost:3000` como base del chat. |

---

## 12. Cómo importar este documento en Notion

1. En Notion, crea una página nueva o abre la que quieras.
2. Escribe `/import` o ve a **Import** en el menú.
3. Elige **Markdown & CSV**.
4. Sube o arrastra el archivo `NOTION_IMPORT_WIZYBOT_IA.md`.
5. Notion convertirá los títulos, listas y bloques de código en bloques editables.

Si prefieres copiar y pegar: pega el contenido de este archivo en una página de Notion; los bloques de código se conservan y los encabezados se convierten en títulos.
