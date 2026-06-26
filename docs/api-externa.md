# API Externa — Pollapp 2026

Documentación de los endpoints públicos para integrar servicios externos (scripts, bots, agentes de IA, etc.) con la plataforma de predicciones.

---

## Autenticación

Todos los endpoints requieren una **API Key** válida. Puedes generar la tuya desde tu perfil en la plataforma.

La clave se envía en cada petición mediante el header `Authorization`:

```
Authorization: Bearer pa_live_<tu_api_key>
```

También se acepta el header alternativo:

```
X-API-Key: pa_live_<tu_api_key>
```

> **Importante:** La API Key identifica tu cuenta de usuario. El parámetro `boardNumber` en la ruta identifica qué tabla se quiere consultar o predecir. Debes ser dueño de esa tabla.

---

## Base URL

```
https://pollapp26.vercel.app/api/external
```

---

## Endpoints

### 1. Consultar partidos

```
GET /api/external/board/:boardNumber
```

Devuelve todos los partidos visibles del torneo asociado a la tabla indicada, junto con la predicción actual de esa tabla para cada partido.

#### Parámetros de ruta

| Parámetro    | Tipo    | Requerido | Descripción                                              |
|--------------|---------|-----------|----------------------------------------------------------|
| `boardNumber`| integer | ✅        | Número secuencial de tu tabla (ej: `1001`)               |

#### Query params

| Parámetro | Tipo   | Requerido | Descripción                                                                 |
|-----------|--------|-----------|-----------------------------------------------------------------------------|
| `date`    | string | ❌        | Filtra los partidos a un día específico en formato `YYYY-MM-DD` (UTC). Si se omite, devuelve todos los partidos. |

#### Ejemplos

```bash
# Todos los partidos de la tabla 1001
curl -H "Authorization: Bearer pa_live_<tu_api_key>" \
  https://pollapp26.vercel.app/api/external/board/1001

# Solo los partidos del 26 de junio de 2026
curl -H "Authorization: Bearer pa_live_<tu_api_key>" \
  https://pollapp26.vercel.app/api/external/board/1001?date=2026-06-26
```

#### Respuesta exitosa `200`

```json
{
  "boardNumber": 1001,
  "boardId": "abc123firestore",
  "date": "2026-06-26",
  "totalMatches": 3,
  "matches": [
    {
      "id": "match_id_firestore",
      "localTeam": {
        "name": "Argentina",
        "logo": "https://..."
      },
      "visitorTeam": {
        "name": "Francia",
        "logo": "https://..."
      },
      "date": "2026-06-26T18:00:00.000Z",
      "phase": "Cuartos de Final",
      "matchNumber": 48,
      "status": "scheduled",
      "result": null,
      "predictionsClosed": false,
      "currentPrediction": {
        "localGoalPrediction": 2,
        "visitorGoalPrediction": 1
      }
    }
  ]
}
```

#### Campos de cada partido

| Campo                | Tipo            | Descripción                                                                                        |
|----------------------|-----------------|----------------------------------------------------------------------------------------------------|
| `id`                 | string          | ID interno del partido en Firestore                                                                |
| `localTeam.name`     | string          | Nombre del equipo local (`TBD` si aún no está definido)                                            |
| `localTeam.logo`     | string \| null  | URL del logo del equipo local                                                                      |
| `visitorTeam.name`   | string          | Nombre del equipo visitante                                                                        |
| `visitorTeam.logo`   | string \| null  | URL del logo del equipo visitante                                                                  |
| `date`               | string (ISO)    | Fecha y hora de inicio del partido en formato ISO 8601 UTC                                         |
| `phase`              | string          | Fase del torneo (ej: `Fase de Grupos`, `Octavos de Final`, `Final`, etc.)                         |
| `matchNumber`        | integer         | Número del partido en el calendario del torneo                                                     |
| `status`             | string          | Estado: `scheduled` \| `active` \| `closed`                                                       |
| `result`             | object \| null  | Solo cuando `status === "closed"`. Contiene `localGoals` y `visitorGoals` (incluye tiempo extra)   |
| `predictionsClosed`  | boolean         | `true` si ya no se pueden modificar predicciones (partido activo, finalizado o a menos de 30 min) |
| `currentPrediction`  | object \| null  | Predicción actual de esta tabla. `null` si no ha sido completada                                  |

---

### 2. Guardar predicciones

```
POST /api/external/board/:boardNumber/predict
```

Guarda o actualiza predicciones para uno o varios partidos de la tabla indicada.

Las predicciones se validan individualmente. Si alguna falla (partido ya iniciado, finalizado, o fuera del plazo), se reporta el motivo sin interrumpir el resto.

#### Parámetros de ruta

| Parámetro    | Tipo    | Requerido | Descripción                          |
|--------------|---------|-----------|--------------------------------------|
| `boardNumber`| integer | ✅        | Número secuencial de tu tabla        |

#### Body

**Modo individual:**

```json
{
  "matchId": "match_id_firestore",
  "localGoalPrediction": 2,
  "visitorGoalPrediction": 1
}
```

**Modo masivo:**

```json
{
  "predictions": [
    { "matchId": "match_id_1", "localGoalPrediction": 2, "visitorGoalPrediction": 1 },
    { "matchId": "match_id_2", "localGoalPrediction": 0, "visitorGoalPrediction": 0 }
  ]
}
```

| Campo                   | Tipo    | Requerido | Descripción                              |
|-------------------------|---------|-----------|------------------------------------------|
| `matchId`               | string  | ✅        | ID del partido obtenido del endpoint GET |
| `localGoalPrediction`   | integer | ✅        | Goles del equipo local. Entero `>= 0`    |
| `visitorGoalPrediction` | integer | ✅        | Goles del equipo visitante. Entero `>= 0`|

#### Ejemplos

```bash
# Predicción individual
curl -X POST \
  -H "Authorization: Bearer pa_live_<tu_api_key>" \
  -H "Content-Type: application/json" \
  -d '{"matchId":"match_abc","localGoalPrediction":2,"visitorGoalPrediction":1}' \
  https://pollapp26.vercel.app/api/external/board/1001/predict

# Predicción masiva
curl -X POST \
  -H "Authorization: Bearer pa_live_<tu_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": [
      {"matchId":"match_abc","localGoalPrediction":2,"visitorGoalPrediction":1},
      {"matchId":"match_def","localGoalPrediction":1,"visitorGoalPrediction":1}
    ]
  }' \
  https://pollapp26.vercel.app/api/external/board/1001/predict
```

#### Respuesta exitosa `200`

```json
{
  "boardNumber": 1001,
  "summary": {
    "total": 3,
    "updated": 2,
    "failed": 1
  },
  "results": [
    {
      "matchId": "match_abc",
      "status": "success",
      "message": "Predicción guardada correctamente."
    },
    {
      "matchId": "match_def",
      "status": "success",
      "message": "Predicción guardada correctamente."
    },
    {
      "matchId": "match_xyz",
      "status": "failed",
      "message": "Las predicciones se cerraron 30 minutos antes del partido (2026-06-26T17:30:00.000Z)."
    }
  ]
}
```

#### Campos de la respuesta

| Campo              | Tipo    | Descripción                                          |
|--------------------|---------|------------------------------------------------------|
| `summary.total`    | integer | Total de predicciones procesadas                     |
| `summary.updated`  | integer | Cantidad guardadas exitosamente                      |
| `summary.failed`   | integer | Cantidad que fallaron                                |
| `results[].matchId`| string  | ID del partido                                       |
| `results[].status` | string  | `"success"` o `"failed"`                            |
| `results[].message`| string  | Detalle del resultado o motivo del fallo             |

---

## Motivos de fallo por predicción

| Motivo                                                   | Descripción                                              |
|----------------------------------------------------------|----------------------------------------------------------|
| `El partido {id} no existe.`                             | El `matchId` no existe en Firestore                      |
| `El partido {id} no pertenece al torneo de tu tabla.`    | El partido es de otro torneo                             |
| `El partido {id} aún no está disponible.`                | El partido no es visible para usuarios finales aún       |
| `El partido ya ha finalizado.`                           | `status === "closed"`                                    |
| `El partido ya está en curso.`                           | `status === "active"`                                    |
| `Las predicciones se cerraron 30 minutos antes...`       | Ya pasó el corte de 30 minutos previos al inicio         |

---

## Errores HTTP

| Código | Descripción                                                                                |
|--------|--------------------------------------------------------------------------------------------|
| `400`  | Parámetros inválidos (boardNumber no es entero, date con formato incorrecto, body vacío)   |
| `401`  | API Key ausente, inválida o revocada                                                       |
| `404`  | No se encontró una tabla activa con ese número asociada a tu cuenta                       |
| `500`  | Error interno del servidor                                                                 |

---

## Ejemplo completo en Python

```python
import requests

API_KEY = "pa_live_<tu_api_key>"
BOARD_NUMBER = 1001
BASE_URL = "https://pollapp26.vercel.app"

headers = {"Authorization": f"Bearer {API_KEY}"}

# 1. Consultar partidos del día
response = requests.get(
    f"{BASE_URL}/api/external/board/{BOARD_NUMBER}",
    params={"date": "2026-06-26"},
    headers=headers
)
data = response.json()

# 2. Filtrar solo los partidos con predicciones abiertas
open_matches = [m for m in data["matches"] if not m["predictionsClosed"]]

# 3. Predecir 2-1 en todos los partidos abiertos
predictions = [
    {"matchId": m["id"], "localGoalPrediction": 2, "visitorGoalPrediction": 1}
    for m in open_matches
]

if predictions:
    result = requests.post(
        f"{BASE_URL}/api/external/board/{BOARD_NUMBER}/predict",
        json={"predictions": predictions},
        headers=headers
    ).json()

    print(f"Total: {result['summary']['total']}")
    print(f"Guardadas: {result['summary']['updated']}")
    print(f"Fallidas: {result['summary']['failed']}")

    for r in result["results"]:
        print(f"  [{r['status'].upper()}] {r['matchId']} — {r['message']}")
```
