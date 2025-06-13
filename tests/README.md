# FilmSage Backend - Test Suite

Esta suite de tests completa está diseñada para garantizar la robustez y confiabilidad de la aplicación FilmSage Backend.

## 🚀 Estructura de Tests

```
tests/
├── setup.js                    # Configuración global de Jest
├── health.test.js              # Test de verificación básica
├── helpers/
│   └── testSetup.js            # Utilidades y configuración de tests
├── unit/                       # Tests unitarios
│   ├── models/
│   │   ├── user.model.test.js
│   │   └── review.model.test.js
│   ├── controllers/
│   │   └── user.controller.test.js
│   ├── middleware/
│   │   └── auth.middleware.test.js
│   └── services/
│       └── tmdbService.test.js
└── integration/                # Tests de integración
    └── routes/
        └── user.routes.test.js
```

## 🧪 Tipos de Tests

### Tests Unitarios
- **Modelos**: Validación de esquemas, constraintes y métodos
- **Controladores**: Lógica de negocio y manejo de errores
- **Middleware**: Autenticación y autorización
- **Servicios**: APIs externas y procesamiento de datos

### Tests de Integración
- **Rutas**: Endpoints completos con autenticación
- **Base de datos**: Operaciones CRUD reales
- **APIs externas**: Integración con servicios externos

## 🛠️ Herramientas Utilizadas

- **Jest**: Framework principal de testing
- **Supertest**: Testing de APIs REST
- **MongoDB Memory Server**: Base de datos en memoria para tests
- **bcrypt**: Para testing de autenticación
- **JSON Web Tokens**: Para testing de autorización

## 📦 Dependencias de Testing

```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "mongodb-memory-server": "^9.1.3",
  "@jest/globals": "^29.7.0"
}
```

## 🏃‍♂️ Comandos Disponibles

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

### Generar reporte de cobertura
```bash
npm run test:coverage
```

### Ejecutar solo tests unitarios
```bash
npm test -- tests/unit
```

### Ejecutar solo tests de integración
```bash
npm test -- tests/integration
```

### Ejecutar tests específicos
```bash
npm test -- tests/unit/models/user.model.test.js
```

## 📊 Cobertura de Tests

Los tests cubren:

✅ **Modelos de Base de Datos**
- Validación de campos requeridos
- Constraints de unicidad
- Validación de tipos de datos
- Valores por defecto
- Relaciones entre modelos

✅ **Controladores**
- Registro y autenticación de usuarios
- Operaciones CRUD
- Manejo de errores
- Validación de datos de entrada
- Respuestas HTTP correctas

✅ **Middleware**
- Autenticación JWT
- Autorización por roles
- Manejo de tokens inválidos
- Verificación de usuarios activos

✅ **Servicios Externos**
- Integración con TMDB API
- Manejo de errores de red
- Validación de respuestas
- Rate limiting

✅ **Rutas de API**
- Endpoints de autenticación
- CRUD de usuarios
- Autorización de endpoints
- Validación de parámetros
- Códigos de estado HTTP

## 🔧 Configuración

### Variables de Entorno para Tests
```bash
# JWT para tests
JWT_SECRET=test-secret-key

# TMDB API (opcional para tests)
TMDB_API_KEY=your-test-api-key

# Base de datos (se usa MongoDB Memory Server)
# No se requiere configuración adicional
```

### Configuración de Jest
La configuración de Jest está en `package.json`:

```json
{
  "jest": {
    "preset": "default",
    "testEnvironment": "node",
    "extensionsToTreatAsEsm": [".js"],
    "transform": {},
    "testMatch": [
      "**/tests/**/*.test.js",
      "**/src/**/*.test.js"
    ],
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/server.js",
      "!src/**/*.test.js"
    ]
  }
}
```

## 🎯 Mejores Prácticas

### 1. Aislamiento de Tests
- Cada test es independiente
- Base de datos se limpia entre tests
- Mocks se resetean automáticamente

### 2. Tests Descriptivos
```javascript
describe('User Authentication', () => {
  it('should login successfully with valid credentials', async () => {
    // Test implementation
  });
  
  it('should return 401 for invalid password', async () => {
    // Test implementation
  });
});
```

### 3. Datos de Test
```javascript
// Usar factory functions para datos consistentes
const createTestUser = () => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
});
```

### 4. Mocking Efectivo
```javascript
// Mock servicios externos
jest.mock('../services/tmdbService.js');

// Mock funciones específicas
const mockFunction = jest.fn().mockResolvedValue(mockData);
```

## 🐛 Depuración de Tests

### Ejecutar un test específico
```bash
npm test -- --testNamePattern="should login successfully"
```

### Ver output detallado
```bash
npm test -- --verbose
```

### Depurar con Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 Métricas de Calidad

### Cobertura Mínima Requerida
- **Líneas**: 90%
- **Funciones**: 95%
- **Branches**: 85%
- **Statements**: 90%

### Criterios de Éxito
- ✅ Todos los tests pasan
- ✅ Cobertura mínima alcanzada
- ✅ Sin memory leaks
- ✅ Tests ejecutan en menos de 30 segundos

## 🔄 CI/CD Integration

Los tests se ejecutan automáticamente en:
- Pull requests
- Merges a main/develop
- Releases

```yaml
# Ejemplo GitHub Actions
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

## 🤝 Contribución

Al agregar nuevas funcionalidades:

1. **Escribir tests primero** (TDD)
2. **Mantener cobertura** mínima
3. **Tests descriptivos** y claros
4. **Mocks apropiados** para dependencias externas
5. **Cleanup** de recursos en afterEach/afterAll

## 📞 Soporte

Para problemas con los tests:
1. Verificar configuración de variables de entorno
2. Ejecutar `npm ci` para dependencias limpias
3. Revisar logs de Jest para errores específicos
4. Consultar documentación de Jest/Supertest 