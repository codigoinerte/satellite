# 🛰️ SATTRACK - Global Satellite Monitoring System

Un sistema de monitoreo de satélites en tiempo real con diseño cyberpunk/futurista, construido con React, Three.js y la API de N2YO.com.

![SATTRACK Preview](https://via.placeholder.com/1200x600/0a0e27/00fff9?text=SATTRACK+Global+Satellite+Monitoring)

## ✨ Características

- 🌍 **Visualización 3D**: Globo terráqueo interactivo con órbitas de satélites en tiempo real
- 🛰️ **Modelos 3D**: Representación 3D de satélites con paneles solares y antenas
- 📊 **Vista de Tabla**: Lista completa de satélites con búsqueda y paginación
- 💾 **Exportación CSV**: Descarga datos de satélites en formato CSV
- 🎨 **Diseño Cyberpunk**: Interfaz futurista con efectos neón y animaciones suaves
- 🌐 **Datos en Tiempo Real**: Integración con N2YO.com API para tracking satelital
- 🖱️ **Interactividad**: Click en satélites para ver información detallada
- 🏳️ **Banderas de Países**: Visualización del país de origen de cada satélite

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

1. Las dependencias ya están instaladas. Si necesitas reinstalar:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:5173`

## 🔑 Configuración de la API (Opcional)

Por defecto, la aplicación usa datos mock para demostración. Para usar datos en tiempo real:

1. Obtén una API key gratuita de [N2YO.com](https://www.n2yo.com/api/)

2. Abre `src/services/satelliteApi.ts`

3. Reemplaza `'YOUR_N2YO_API_KEY'` con tu API key:
```typescript
const API_KEY = 'TU-API-KEY-AQUI';
```

4. En `src/App.tsx`, cambia la línea 27:
```typescript
// De:
const data = getMockSatellites();

// A:
const data = await getAllSatellites();
```

## 🎮 Uso

### Vista 3D Globe

- **Rotar**: Click izquierdo + arrastrar
- **Zoom**: Scroll del mouse
- **Pan**: Click derecho + arrastrar
- **Seleccionar satélite**: Click en cualquier satélite
- **Hover**: Pasa el mouse sobre un satélite para ver su nombre y órbita

### Vista Data Table

- **Buscar**: Usa el campo de búsqueda para filtrar por nombre o país
- **Ver detalles**: Click en el botón "View" de cualquier satélite
- **Exportar**: Click en "Export CSV" para descargar la lista completa
- **Navegar**: Usa los botones de paginación para ver más satélites

## 🏗️ Estructura del Proyecto

```
satellite/
├── src/
│   ├── components/
│   │   ├── Earth/
│   │   │   ├── Earth.tsx          # Componente del globo terráqueo
│   │   │   └── EarthScene.tsx     # Escena 3D principal
│   │   ├── Satellite/
│   │   │   └── Satellite3D.tsx    # Modelo 3D del satélite
│   │   ├── Table/
│   │   │   └── SatelliteTable.tsx # Tabla de datos
│   │   ├── UI/
│   │   │   ├── SatelliteInfo.tsx  # Modal de información
│   │   │   ├── StatsPanel.tsx     # Panel de estadísticas
│   │   │   └── Tabs.tsx           # Navegación por tabs
│   │   └── Layout/
│   │       ├── Header.tsx         # Encabezado
│   │       └── Footer.tsx         # Pie de página
│   ├── services/
│   │   └── satelliteApi.ts        # Integración con API
│   ├── types/
│   │   └── satellite.ts           # Tipos TypeScript
│   ├── styles/
│   │   └── global.css             # Estilos globales
│   ├── App.tsx                    # Componente principal
│   └── main.tsx                   # Punto de entrada
├── package.json
└── README.md
```

## 🎨 Personalización del Diseño

Los colores del tema cyberpunk se pueden personalizar en `src/styles/global.css`:

```css
:root {
  --cyber-primary: #00fff9;      /* Cyan neón */
  --cyber-secondary: #ff00ff;    /* Magenta */
  --cyber-accent: #7928ca;       /* Púrpura */
  --cyber-warning: #ff0080;      /* Rosa */
  --cyber-success: #00ff41;      /* Verde */
  --cyber-bg-dark: #0a0e27;      /* Fondo oscuro */
  --cyber-bg-darker: #050816;    /* Fondo más oscuro */
}
```

## 📦 Tecnologías Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Three.js** - Motor de gráficos 3D
- **React Three Fiber** - React renderer para Three.js
- **React Three Drei** - Helpers para React Three Fiber
- **Framer Motion** - Animaciones
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos
- **Satellite.js** - Cálculos orbitales

## 🌟 Características Destacadas

### Sistema de Órbitas Realista
Los satélites siguen órbitas calculadas basadas en datos reales de TLE (Two-Line Elements) cuando se usa la API de N2YO.

### Diseño Responsive
La interfaz se adapta a diferentes tamaños de pantalla, desde móviles hasta pantallas grandes.

### Optimización de Rendimiento
- Renderizado eficiente con React Three Fiber
- Memoización de componentes
- Lazy loading de datos

### Accesibilidad
- Navegación por teclado
- Labels semánticos
- Contraste de colores optimizado

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Error de tipos TypeScript
```bash
# Reinstala tipos
npm install -D @types/three
```

### La API no responde
- Verifica que tu API key sea válida
- Revisa los límites de tasa de la API (300 transacciones/hora en plan gratuito)
- Comprueba tu conexión a internet

## 📝 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza el build de producción
npm run lint     # Ejecuta el linter
```

## 📧 Contacto

Para preguntas o soporte, abre un issue en el repositorio.

## 🙏 Agradecimientos

- [N2YO.com](https://www.n2yo.com/) por proporcionar la API de tracking satelital
- [Three.js](https://threejs.org/) por el motor de gráficos 3D
- [Flag CDN](https://flagcdn.com/) por las banderas de países

---

<div align="center">
  Made with 💜 by SATTRACK Team
</div>
