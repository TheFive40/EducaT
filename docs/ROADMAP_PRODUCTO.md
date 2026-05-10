# Roadmap de Producto EducaT
## De MVP a Plataforma Enterprise para Instituciones Colombianas

---

## Visión

Convertir EducaT en la plataforma de gestión educativa de referencia para colegios públicos y privados en Colombia, superando a Académico en funcionalidad y a Moodle en usabilidad, manteniendo un precio accesible para instituciones con presupuestos limitados.

---

## Fase 1: Cimentación Enterprise (Mes 1-2)
**Objetivo**: Hacer EducaT vendible y seguro para colegios con +1.000 estudiantes.

### Seguridad y Estabilidad
- [ ] Agregar `@PreAuthorize` a todos los endpoints que carecen de protección de roles.
- [ ] Implementar rate limiting en endpoints críticos (login, entregas, calificaciones).
- [ ] Auditoría de cambios en notas: tabla `GradeAuditLog` que registre quién, cuándo y qué nota modificó.
- [ ] Validación estricta en todos los DTOs (`@NotBlank`, `@Size`, `@Pattern`).
- [ ] Forzar HTTPS en producción y headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, CSP).

### White-Label Básico
- [ ] Crear entidad `InstitutionConfig` (logo URL, color primario, color secundario, nombre institucional).
- [ ] Personalizar login, sidebar y certificados con datos de `InstitutionConfig`.
- [ ] Permitir subir logo desde panel de administrador.

### Calidad de Datos
- [ ] Validar unicidad de códigos de estudiante por institución.
- [ ] Sanitizar todos los inputs HTML del frontend para prevenir XSS.

**KPIs de Fase 1**:
- 0 endpoints públicos sin autorización.
- 100% de certificados generados con branding institucional.

---

## Fase 2: Escalabilidad y Multi-Tenancy (Mes 2-3)
**Objetivo**: Permitir que múltiples colegios operen en la misma instancia sin mezclar datos.

### Arquitectura Multi-Tenant
- [ ] Agregar `institutionId` a todas las entidades principales (Student, Course, Teacher, Activity, Grade).
- [ ] Filtro automático por `institutionId` en todos los repositorios.
- [ ] Super-admin puede crear nuevas instituciones y asignarles un subdominio (`colegiosanjose.educat.co`).

### Almacenamiento de Archivos
- [ ] Migrar archivos de JSON/base64 en base de datos a almacenamiento en filesystem local (fase inicial) o S3-compatible (fase avanzada).
- [ ] Implementar cuotas de almacenamiento por institución (ej. 10GB plan básico, 50GB plan premium).
- [ ] Compresión automática de imágenes y prevención de archivos ejecutables.

### Performance
- [ ] Paginar todas las listas que hoy cargan en memoria (+500 items).
- [ ] Agregar índices de base de datos en campos de búsqueda frecuente (`student_code`, `course_code`, `enrollment_status`).

**KPIs de Fase 2**:
- Tiempo de carga del dashboard < 2 segundos con 2.000 estudiantes.
- Capacidad de alojar 10 instituciones en una sola instancia sin mezcla de datos.

---

## Fase 3: Piloto en Colegios Públicos (Mes 3-4)
**Objetivo**: Validar el producto en el mundo real y construir casos de éxito.

### Preparación Comercial
- [ ] Definir contrato modelo de suscripción (contrato de adhesión o contrato de prestación de servicios).
- [ ] Crear material de ventas: brochure PDF, video demo de 3 minutos, página de precios en web.
- [ ] Implementar proceso de onboarding automático: formulario de inscripción → pago (PayU, MercadoPago o transferencia) → creación de instancia en 24h.

### Pilotos
- [ ] Seleccionar 2 colegios públicos en Barranquilla (uno pequeño de ~300 alumnos, uno mediano de ~800).
- [ ] Implementación gratuita de 3 meses con acompañamiento semanal.
- [ ] Recolección de métricas: adopción docente (% de docentes que crean actividades semanalmente), satisfacción (encuesta NPS), reducción de tiempo administrativo.

### Funcionalidades Piloto
- [ ] Reporte de deserción escolar automático (alerta si un estudiante acumula >20% inasistencias).
- [ ] Integración básica con SISBEN o SIMAT (consulta masiva de estudiantes si hay API disponible).
- [ ] Exportación de planillas de notas en formato oficial de la Secretaría de Educación.

**KPIs de Fase 3**:
- 2 colegios piloto activos con >70% de adopción docente.
- NPS de docentes > 50.

---

## Fase 4: Convenio Distrital y Escalamiento (Mes 4-6)
**Objetivo**: Cerrar el primer convenio con una Secretaría de Educación.

### Funcionalidades Distritales
- [ ] Dashboard de supervisión para la SED: matrícula por colegio, promedio de notas por zona, tasas de aprobación/deserción.
- [ ] Reportes comparativos entre colegios del mismo distrito (anónimos o identificados).
- [ ] Single Sign-On (SSO) con credenciales institucionales del distrito (SAML 2.0 o OAuth2).
- [ ] API pública (rate-limited) para que la SED extraiga datos agregados.

### Monetización
- [ ] Definir paquete "EducaT Distrital" con precio anual fijo por número de colegios o número total de estudiantes.
- [ ] Ofrecer módulos premium opcionales: biblioteca digital, comedor escolar, transporte escolar.

### Expansión Geográfica
- [ ] Adaptar formatos de certificados y reportes para otras ciudades (Cartagena, Santa Marta, Montería).
- [ ] Conseguir 1 aliado comercial en cada ciudad para ventas y soporte local.

**KPIs de Fase 4**:
- 1 convenio distrital firmado.
- 15+ colegios activos pagando.
- Ingresos recurrentes mensuales > $10.000.000 COP.

---

## Fase 5: Consolidación Nacional (Mes 6-12)
**Objetivo**: Ser el LMS más usado en colegios públicos de la Costa Caribe colombiana.

### Producto
- [ ] App móvil híbrida (Flutter o React Native) para estudiantes y padres.
- [ ] Módulo de pagos en línea (matrículas, papelería, eventos) integrado con PayU.
- [ ] Inteligencia básica: alertas tempranas de riesgo académico (machine learning simple sobre asistencia + notas).

### Mercado
- [ ] Presencia en ferias educativas (Andicom, FCE, eventos de la SED Barranquilla).
- [ ] Programa de referidos: colegio que refiere a otro gana 1 mes gratis.
- [ ] Certificación "EducaT Partner" para docentes que dominen la plataforma.

**KPIs de Fase 5**:
- 100+ colegios activos.
- 50.000+ estudiantes en plataforma.
- Equipo de 3 personas (1 dev, 1 comercial, 1 soporte).

---

## Priorización Ágil

Este roadmap es una guía, no una cárcel. La priorización real debe responder a la regla:

> **"¿Qué funcionalidad desbloquea el siguiente cliente o reduce la rotación de los actuales?"**

Si un rector dice "firmo hoy si tienen reportes para la SED", se mueve Fase 4 adelante.
Si un docente dice "no uso la plataforma porque no carga en mi celular", se mueve la app móvil adelante.

---

*Roadmap v1.0 - EducaT*
*Actualizado: Mayo 2026*
