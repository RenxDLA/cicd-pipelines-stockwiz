# k6 Load Testing (Simplificado)

Prueba de carga básica para validar rendimiento de la API StockWiz.

## Qué hace el test

- 10 usuarios concurrentes durante 1 minuto
- Prueba 3 endpoints: `/health`, `/api/products`, `/api/inventory`
- Valida que 95% de requests completen en < 1 segundo
- Valida que < 10% de requests fallen

## Métricas importantes

Al finalizar verás en la consola:
- **http_req_duration**: Tiempo de respuesta promedio y p95
- **http_req_failed**: % de requests fallidos
- **http_reqs**: Total de requests realizados

## En el pipeline

Se ejecuta automáticamente después del deploy y genera un JSON con los resultados.
