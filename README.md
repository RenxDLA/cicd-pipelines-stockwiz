# cicd-pipelines-stockwiz

Repositorio de pipelines CI/CD para la aplicación StockWiz. Contiene los workflows de GitHub Actions para automatizar el build, deploy y testing de los microservicios en múltiples ambientes.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura de Pipelines](#arquitectura-de-pipelines)
- [Prerequisitos](#prerequisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Workflows Implementados](#workflows-implementados)
- [Ambientes](#ambientes)
- [Configuración](#configuración)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Pruebas de Carga con k6](#pruebas-de-carga-con-k6)
- [Variables y Secrets](#variables-y-secrets)
- [Uso](#uso)

## 🎯 Descripción General

Este repositorio implementa una estrategia completa de CI/CD para la aplicación StockWiz, incluyendo:

- 🏗️ **Build automatizado** de imágenes Docker para cada microservicio
- 🚀 **Deploy multi-ambiente** (dev, test, prod)
- 🔍 **Análisis de código** con SonarCloud
- 📊 **Pruebas de rendimiento** con k6
- 🔄 **Actualizaciones automáticas** de servicios ECS

## 🏗️ Arquitectura de Pipelines

```

  Pipeline Deploy (deploy.yaml)                          
  ├─ Checkout repos                                      
  ├─ Set environment variables                           
  ├─ SonarCloud Analysis                                 
  ├─ Build & Push Docker images                          
  │  ├─ product-service                                  
  │  ├─ inventory-service                                
  │  └─ api-gateway                                      
  └─ Update ECS Services                                 


  Pipeline Testing (testing.yaml)                        
  ├─ Wait for deployment (5 min)                         
  ├─ Run k6 load tests                                   
  └─ Upload test results                                 

```

## 📦 Prerequisitos

- Cuenta de AWS con servicios ECS y ECR configurados
- Repositorio de aplicación StockWiz con código de microservicios
- SonarCloud account para análisis de código
- GitHub repository con Actions habilitado

## 📁 Estructura del Proyecto

```
cicd-pipelines-stockwiz/
├── README.md
├── .github/
│   └── workflows/
│       ├── deploy.yaml       # Pipeline principal de deploy
│       └── testing.yaml      # Pipeline de pruebas post-deploy
└── tests/
    └── k6/
        ├── load-test.js      # Script de pruebas de carga
        └── README.md         # Documentación de k6
```

## 🔄 Workflows Implementados

### 1. Build & Deploy Pipeline (`deploy.yaml`)

**Propósito**: Construir imágenes Docker y desplegarlas en ECS según el ambiente.

**Trigger**: 
- Push a `develop`, `test`, o `main`
- Ejecución manual (`workflow_dispatch`)

**Pasos principales**:

1. **Checkout de repositorios**
   - Clona este repositorio (CI/CD)
   - Clona el repositorio de la aplicación StockWiz

2. **Configuración de ambiente**
   - `develop` → ambiente `dev` (Stream cluster)
   - `test` → ambiente `test` (Stream cluster)
   - `main` → ambiente `prod` (Main cluster)

3. **Análisis de código con SonarCloud**
   - Escaneo estático de código
   - Detección de vulnerabilidades
   - Análisis de calidad de código
   - Exclusión de archivos de test y dependencias

4. **Build y Push de imágenes Docker**
   - **Product Service**: 
     - Build de imagen desde `./product-service`
     - Tag: `product-service-{environment}`
     - Tag latest: `product-service-{environment}-latest`
   
   - **Inventory Service**: 
     - Build de imagen desde `./inventory-service`
     - Tag: `inventory-service-{environment}`
     - Tag latest: `inventory-service-{environment}-latest`
   
   - **API Gateway**: 
     - Build de imagen desde `./api-gateway`
     - Tag: `api-service-{environment}`
     - Tag latest: `api-service-{environment}-latest`

5. **Deploy a ECS**
   - Actualiza el servicio API Gateway (contiene los 3 containers como sidecars)
   - Force new deployment para usar las nuevas imágenes
   - Los servicios se actualizan automáticamente

**Características**:
- ✅ Multi-ambiente con configuración dinámica
- ✅ Tagging automático de imágenes con ambiente
- ✅ Integración con SonarCloud

### 2. Post-Deployment Testing Pipeline (`testing.yaml`)

**Propósito**: Validar el deployment con pruebas de carga automatizadas.

**Trigger**: 
- Push a `develop`, `test`, o `main` (después del deploy)
- Ejecución manual (`workflow_dispatch`)

**Pasos principales**:

1. **Wait for deployment** (Job 1)
   - Espera 5 minutos para que el deployment se estabilice
   - Permite que los health checks de ECS completen

2. **k6 Load Tests** (Job 2 - depende de Job 1)
   - Ejecuta pruebas de carga con k6
   - 10 usuarios virtuales concurrentes durante 1 minuto
   - Valida endpoint `/health`
   - Thresholds:
     - `http_req_duration`: p(95) < 1000ms
     - `http_req_failed`: rate < 0.1 (menos de 10% de errores)

3. **Upload results**
   - Guarda resultados en formato JSON
   - Artifacts disponibles por 30 días
   - Resultados por ambiente separados

**Características**:
- ✅ Testing automático post-deploy
- ✅ Quality gates con thresholds configurables
- ✅ Resultados históricos guardados como artifacts
- ✅ Ejecución en contenedor k6 oficial

## 🌍 Ambientes

El pipeline soporta tres ambientes con configuración independiente:

| Ambiente | Rama      | ECS Cluster | Variables Cluster         |  Variables Service         |
|----------|-----------|-------------|---------------------------| ---------------------------|
| **Dev**  | `develop` | Stream      | `ECS_CLUSTER_STREAM`      |  `SERVICE_URL_DEV`         |  
| **Test** | `test`    | Stream      | `ECS_CLUSTER_STREAM`      |  `SERVICE_URL_TEST`        |  
| **Prod** | `main`    | Main        | `ECS_CLUSTER_MAIN`        |  `SERVICE_URL_PROD`        |  

## ⚙️ Configuración

### Secrets Requeridos en GitHub

```
# AWS Credentials
AWS_ACCESS_KEY_ID          # Access Key ID de AWS
AWS_SECRET_ACCESS_KEY      # Secret Access Key de AWS
AWS_SESSION_TOKEN          # Session Token (si usas AWS Academy)

# SonarCloud
SONAR_TOKEN                # Token de autenticación de SonarCloud
SONAR_ORGANIZATION         # Nombre de la organización en SonarCloud

# Service URLs (para testing)
SERVICE_URL_DEV            # URL del ALB en ambiente dev
SERVICE_URL_TEST           # URL del ALB en ambiente test
SERVICE_URL_PROD           # URL del ALB en ambiente prod
```

### Variables de Repositorio

```
# ECR
ECR_REPO                   # Nombre del repositorio ECR

# ECS Clusters
ECS_CLUSTER_STREAM         # Nombre del cluster ECS para dev/test
ECS_CLUSTER_MAIN           # Nombre del cluster ECS para prod

# ECS Services
SERVICE_API_GATEWAY_NAME   # Nombre del servicio API Gateway
```

**Configuración**: Repository Settings → Secrets and variables → Actions

## 🚀 Flujo de Trabajo

### Deploy a Desarrollo

```bash
git checkout develop
# Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop
```

El pipeline automáticamente:
1. ✅ Ejecuta SonarCloud analysis
2. ✅ Construye imágenes Docker con tag `*-dev`
3. ✅ Pushea a ECR
4. ✅ Actualiza servicios en cluster Stream (dev)
5. ✅ Espera 5 minutos
6. ✅ Ejecuta pruebas k6
7. ✅ Guarda resultados

### Deploy a Testing

```bash
git checkout test
git merge develop
git push origin test
```

Mismo flujo pero con tag `*-test` y cluster Stream (test).

### Deploy a Producción

```bash
git checkout main
git merge test  # o develop, según tu estrategia
git push origin main
```

Mismo flujo pero con tag `*-prod` y cluster Main (prod).

## 📊 Pruebas de Carga con k6

### Configuración de Pruebas

El script `tests/k6/load-test.js` configura:

```javascript
export const options = {
  vus: 10,                          // 10 usuarios virtuales
  duration: '1m',                   // Duración de 1 minuto
  thresholds: {
    'http_req_duration': ['p(95)<1000'],  // 95% < 1s
    'http_req_failed': ['rate<0.1'],      // < 10% errores
  },
};
```

### Endpoints Testeados

- `/health` - Health check principal

### Métricas Clave

| Métrica              | Descripción                          | Threshold      |
|----------------------|--------------------------------------|----------------|
| `http_req_duration`  | Tiempo de respuesta (p95)            | < 1000ms       |
| `http_req_failed`    | Tasa de errores                      | < 10%          |
| `http_reqs`          | Total de requests por segundo        | -              |
| `iterations`         | Iteraciones completadas              | -              |

### Ver Resultados

Los resultados se guardan como artifacts en GitHub Actions:

1. Ir a Actions → Seleccionar workflow run
2. Scroll hasta "Artifacts"
3. Descargar `k6-results-{environment}`
4. Analizar el archivo JSON

## 🔧 Uso

### Ejecutar Deploy Manualmente

1. Ir a **Actions** en GitHub
2. Seleccionar **Build & Deploy Microservices**
3. Click en **Run workflow**
4. Seleccionar la rama (develop/test/main)
5. Click en **Run workflow**

### Ejecutar Testing Manualmente

1. Ir a **Actions** en GitHub
2. Seleccionar **Post-Deployment Tests**
3. Click en **Run workflow**
4. Seleccionar la rama
5. Click en **Run workflow**

### Monitorear Ejecución

```bash
# Ver logs en tiempo real
# Ir a Actions → Seleccionar el workflow run → Ver logs de cada step
```

## 📈 Mejores Prácticas

1. ✅ **Siempre probar en dev/test antes de producción**
2. ✅ **Revisar resultados de SonarCloud antes de merge**
3. ✅ **Validar que k6 tests pasen en todos los ambientes**
4. ✅ **Monitorear métricas de CloudWatch después del deploy**
5. ✅ **Mantener secrets actualizados (especialmente AWS_SESSION_TOKEN)**
6. ✅ **Revisar artifacts de k6 para analizar tendencias de performance**

## 📝 Notas Importantes

1. **Dependencias**: Requiere infraestructura de Terraform desplegada previamente
2. **Repositorio StockWiz**: El pipeline hace checkout del repo `ORT-ATI-CertificadoDevOps/StockWiz`
3. **Session Token**: Si usas AWS Academy, actualizar `AWS_SESSION_TOKEN` cada 4 horas
4. **Testing delay**: El pipeline espera 5 minutos antes de ejecutar k6 tests
5. **Artifacts retention**: Resultados de k6 se mantienen 30 días
