# Contrato API - Student Dashboard (Ausencias, Evaluaciones, Bienestar)

Este documento define el contrato exacto para reemplazar `localStorage` en `student-dashboard.js` en 3 modulos:

- Ausencias (`educat_ausencias_*`, `educat_absence_reports`)
- Evaluaciones (`educat_eval_*`, `educat_autoeval_*`, `*_sent`)
- Bienestar (`educat_wellness_*`)

## Convenciones generales

- Base URL: `http://localhost:8080`
- Auth: Basic Auth (igual al resto de APIs del proyecto)
- Fechas:
  - `LocalDate`: `yyyy-MM-dd`
  - `LocalDateTime`: ISO-8601 (`yyyy-MM-dd'T'HH:mm:ss`)
- Listados paginados usan `Page<T>` de Spring:

```json
{
  "content": [],
  "pageable": { "pageNumber": 0, "pageSize": 10 },
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 10,
  "first": true,
  "last": true
}
```

---

## 1) Ausencias

### 1.1 Crear reporte de ausencia

`POST /api/student/absence-reports`

Request:

```json
{
  "studentId": 1,
  "courseId": 3,
  "absenceDate": "2026-04-17",
  "reason": "Cita medica",
  "description": "Control con especialista.",
  "attachments": [
    "data:application/pdf;base64,JVBERi0xLjc...",
    "data:image/png;base64,iVBORw0KGgo..."
  ]
}
```

Response (`201`):

```json
{
  "id": 25,
  "student": { "id": 1, "studentCode": "EST-2024-101", "user": { "id": 8, "name": "Maria" } },
  "course": { "id": 3, "name": "Ciencias Naturales" },
  "absenceDate": "2026-04-17",
  "reason": "Cita medica",
  "description": "Control con especialista.",
  "attachments": [
    "data:application/pdf;base64,JVBERi0xLjc...",
    "data:image/png;base64,iVBORw0KGgo..."
  ],
  "status": "PENDING",
  "createdAt": "2026-04-17T19:50:21",
  "reviewedAt": null,
  "reviewComment": null,
  "reviewerUserId": null
}
```

### 1.2 Historial por estudiante (reemplaza `educat_ausencias_{sid}`)

`GET /api/student/absence-reports/student/{studentId}?page=0&size=10&courseId=&status=`

`status` validos: `PENDING`, `APPROVED`, `REJECTED`

### 1.3 Detalle

`GET /api/student/absence-reports/{id}`

---

## 2) Evaluaciones (docente/autoevaluacion)

### 2.1 Guardar respuestas (upsert)

`POST /api/student/evaluation-submissions`

- `evaluationType` validos: `EVAL`, `AUTOEVAL`
- `answers` es un mapa flexible: soporta `si/no`, numericos, texto, arrays.
- `submitted` distingue borrador (`false`) de enviado final (`true`).

Request:

```json
{
  "studentId": 1,
  "courseId": 2,
  "evaluationType": "EVAL",
  "submitted": true,
  "answers": {
    "q1": "si",
    "q2": "no",
    "q4": 4,
    "q8": "Explica con claridad",
    "q9": "Mas ejemplos practicos"
  }
}
```

Response (`201`):

```json
{
  "id": 80,
  "student": { "id": 1, "studentCode": "EST-2024-101", "user": { "id": 8, "name": "Maria" } },
  "course": { "id": 2, "name": "Literatura y Expresion" },
  "evaluationType": "EVAL",
  "submitted": true,
  "answers": {
    "q1": "si",
    "q2": "no",
    "q4": 4,
    "q8": "Explica con claridad",
    "q9": "Mas ejemplos practicos"
  },
  "submittedAt": "2026-04-17T19:50:22"
}
```

### 2.2 Cargar evaluaciones por estudiante/curso/tipo

`GET /api/student/evaluation-submissions/student/{studentId}?page=0&size=10&courseId=2&evaluationType=EVAL&submitted=true`

### 2.3 Detalle

`GET /api/student/evaluation-submissions/{id}`

### 2.4 Migracion de llaves localStorage

- `educat_eval_{sid}_{courseId}` y `educat_autoeval_{sid}_{courseId}`
  - ahora se reemplazan por `answers` en backend, guardando borrador con `submitted=false`.
- `..._sent`
  - ahora se reemplaza por `submitted=true` en backend.

---

## 3) Bienestar

Se usara un contrato unico para solicitudes del estudiante (citas, registros, postulaciones, etc.) con `moduleType + title + payload`.

### 3.1 Crear solicitud de bienestar

`POST /api/student/wellbeing-requests`

`moduleType` validos:

- `PSYCHOLOGY`
- `SPORTS`
- `ART`
- `ORIENTATION`
- `MEDICAL`
- `SCHOLARSHIPS`

Request base:

```json
{
  "studentId": 1,
  "moduleType": "PSYCHOLOGY",
  "title": "PSYCH_APPOINTMENT",
  "message": "Necesito apoyo por estres academico",
  "scheduledAt": "2026-04-20T09:30:00",
  "payload": {
    "professionalId": "ps1",
    "professionalName": "Dra. Laura Sanchez",
    "date": "2026-04-20",
    "slot": "09:30",
    "reasonHtml": "<p>Ansiedad por examenes</p>"
  }
}
```

Response (`201`):

```json
{
  "id": 101,
  "student": { "id": 1, "studentCode": "EST-2024-101", "user": { "id": 8, "name": "Maria" } },
  "moduleType": "PSYCHOLOGY",
  "title": "PSYCH_APPOINTMENT",
  "message": "Necesito apoyo por estres academico",
  "payload": {
    "professionalId": "ps1",
    "professionalName": "Dra. Laura Sanchez",
    "date": "2026-04-20",
    "slot": "09:30",
    "reasonHtml": "<p>Ansiedad por examenes</p>"
  },
  "requestedAt": "2026-04-17T19:50:22",
  "scheduledAt": "2026-04-20T09:30:00",
  "status": "PENDING",
  "resolutionComment": null
}
```

### 3.2 Historial por estudiante

`GET /api/student/wellbeing-requests/student/{studentId}?page=0&size=10&moduleType=&status=`

`status` validos: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

### 3.3 Detalle

`GET /api/student/wellbeing-requests/{id}`

### 3.4 Mapeo directo de acciones UI a `title`

- Cita psicologica: `PSYCH_APPOINTMENT`
- Solicitud medica: `MEDICAL_APPOINTMENT`
- Inscripcion convocatoria deporte: `SPORT_CALL_REGISTRATION`
- Registro taller orientacion: `WORKSHOP_REGISTRATION`
- Postulacion beca: `SCHOLARSHIP_APPLICATION`
- Reaccion post bienestar: `POST_REACTION`
- Comentario post bienestar: `POST_COMMENT`

Para `POST_REACTION` y `POST_COMMENT`, usar `payload` ejemplo:

```json
{
  "studentId": 1,
  "moduleType": "SPORTS",
  "title": "POST_REACTION",
  "message": "",
  "payload": {
    "section": "sports",
    "postId": "spo-1",
    "reaction": "like"
  }
}
```

```json
{
  "studentId": 1,
  "moduleType": "SPORTS",
  "title": "POST_COMMENT",
  "message": "Excelente iniciativa",
  "payload": {
    "section": "sports",
    "postId": "spo-1"
  }
}
```

---

## 4) Errores esperados

Formato manejado por `GlobalExceptionHandler`:

```json
{
  "timestamp": "2026-04-17T19:50:22",
  "status": 400,
  "message": "Invalid wellbeing module type: NUTRITION"
}
```

Validaciones de bean (`@Valid`):

```json
{
  "timestamp": "2026-04-17T19:50:22",
  "status": 400,
  "errors": {
    "studentId": "must not be null",
    "title": "must not be blank"
  }
}
```

---

## 5) Plan de conexion endpoint por endpoint (sin localStorage)

1. **Ausencias**
   - Enviar formulario -> `POST /api/student/absence-reports`
   - Recargar historial -> `GET /api/student/absence-reports/student/{sid}`
2. **Evaluaciones**
   - Al abrir tab curso -> `GET /api/student/evaluation-submissions/student/{sid}?courseId={cid}&evaluationType={EVAL|AUTOEVAL}`
   - Al enviar -> `POST /api/student/evaluation-submissions`
3. **Bienestar**
   - Cada accion (cita, solicitud, registro, beca, reaccion, comentario) -> `POST /api/student/wellbeing-requests`
   - Historial/modulo -> `GET /api/student/wellbeing-requests/student/{sid}?moduleType={...}`

Con este contrato, `student-dashboard.js` puede migrar modulo por modulo eliminando persistencia en `localStorage`.

