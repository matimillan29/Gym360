# Gym360 - Sistema de Gestión para Gimnasios

## Descripción General

Aplicación web para administración de gimnasios, orientada a entrenadores y entrenados. Permite gestionar planes de entrenamiento con periodización (macro/meso/microciclos), seguimiento de progresión, cuotas y evaluaciones.

**Stack tecnológico:**
- **Frontend:** React (PWA) - preparado para futura migración a iOS/Android con Capacitor
- **Backend:** Laravel (PHP 8.1+)
- **Base de datos:** MySQL/MariaDB
- **Servidor:** Cloudron (LAMP)
- **Email:** SMTP via variables de entorno

---

## Roles de Usuario

### 1. ADMIN (primer entrenador)
- Todos los permisos de entrenador
- CRUD de entrenadores
- Configuración del sistema (logo, nombre, color principal)
- Primer usuario creado en instalación inicial

### 2. ENTRENADOR
- Login: usuario/contraseña tradicional
- Gestión completa de sus entrenados asignados
- Vista de todos los entrenados del gym (solo lectura si no están asignados)
- Crear/editar planes de entrenamiento
- Gestionar cuotas y pagos
- Realizar anamnesis y evaluaciones
- Registrar feedback
- Adjuntar links al perfil de entrenados

### 3. ENTRENADO
- Login: código OTP por email (un solo uso)
- Ver perfil personal y anamnesis
- Ver plan de entrenamiento (solo etapa/macrociclo actual desbloqueado)
- Cargar desempeño diario de sesiones
- Ver estado de cuota
- Ver evaluaciones y progresión
- Descargar plan en PDF
- Ver links adjuntos por entrenador

---

## Módulos del Sistema

### Módulo 1: Autenticación

#### Entrenador/Admin
- Login con email y contraseña
- Recuperación de contraseña por email
- Sesiones persistentes

#### Entrenado
- Solicitud de código OTP ingresando email
- Código de 6 dígitos enviado por email
- Código válido por 10 minutos, un solo uso
- Sin contraseña almacenada

---

### Módulo 2: Gestión de Entrenados

#### Datos personales
| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre | string | Sí |
| Apellido | string | Sí |
| DNI | string | Sí |
| Email | string | Sí |
| Teléfono | string | Sí |
| Fecha nacimiento | date | Sí |
| Profesión | string | No |
| Foto | image | No |

#### Estados del entrenado
- **Activo:** puede acceder normalmente
- **Baja temporal:** no puede acceder, datos conservados (vacaciones, lesión)
- **Inactivo:** dado de baja definitiva

#### Asignación de entrenador
- Un entrenado tiene UN entrenador asignado (puede editar)
- Otros entrenadores pueden ver datos (solo lectura)
- Se puede reasignar entrenador en cualquier momento

---

### Módulo 3: Anamnesis Deportiva

Formulario estructurado que completa el entrenador:

#### Sección: Datos Antropométricos
| Campo | Tipo |
|-------|------|
| Peso (kg) | decimal |
| Altura (cm) | decimal |
| IMC | calculado |
| Hombros (cm) | decimal |
| Tórax (cm) | decimal |
| Cintura (cm) | decimal |
| Cadera (cm) | decimal |
| Muslo derecho (cm) | decimal |
| Muslo izquierdo (cm) | decimal |
| Gemelo derecho (cm) | decimal |
| Gemelo izquierdo (cm) | decimal |
| Brazo derecho (cm) | decimal |
| Brazo izquierdo (cm) | decimal |

#### Sección: Historial Médico
| Campo | Tipo |
|-------|------|
| Lesiones previas | textarea |
| Lesiones actuales | textarea |
| Cirugías | textarea |
| Molestias/dolores | textarea |
| Condiciones médicas | textarea |
| Medicación actual | textarea |
| Alergias | textarea |

#### Sección: Historial Deportivo
| Campo | Tipo |
|-------|------|
| Experiencia en gimnasio | select (ninguna/principiante/intermedio/avanzado) |
| Años de entrenamiento | number |
| Deportes practicados | textarea |
| Frecuencia actual de actividad | select |
| Objetivos principales | textarea |
| Objetivos secundarios | textarea |
| Disponibilidad semanal (días) | number |
| Tiempo disponible por sesión | select |

#### Sección: Condicionantes
| Campo | Tipo |
|-------|------|
| Ejercicios contraindicados | textarea |
| Limitaciones de movimiento | textarea |
| Equipamiento disponible en casa | textarea |
| Notas adicionales | textarea |

---

### Módulo 4: Biblioteca de Ejercicios

#### Estructura de ejercicio
| Campo | Tipo |
|-------|------|
| Nombre | string |
| Descripción | text |
| Link video (YouTube) | url (opcional) |
| Etapa de entrenamiento | select múltiple |
| Categoría por zona | select múltiple |
| Patrón de movimiento | select múltiple |
| Es ejercicio global | boolean |

#### Etapas de entrenamiento
- Movilidad
- Calentamiento
- Activación
- Zona media / Core
- Principal
- Accesorios
- Enfriamiento / Vuelta a la calma

#### Categorías por zona corporal
- Tren superior
- Tren inferior
- Core / Zona media
- Cuerpo completo

#### Patrones de movimiento
- Empuje horizontal
- Empuje vertical
- Tirón horizontal
- Tirón vertical
- Dominante de rodilla (sentadilla)
- Dominante de cadera (bisagra)
- Cargadas
- Acarreos
- Rotación / Anti-rotación
- Cardio / Metabólico

#### Grupos musculares (tags)
- Pectorales
- Dorsales
- Deltoides
- Trapecios
- Bíceps
- Tríceps
- Antebrazos
- Abdominales
- Oblicuos
- Lumbares
- Glúteos
- Cuádriceps
- Isquiotibiales
- Aductores
- Abductores
- Gemelos / Pantorrillas

#### Biblioteca precargada
El sistema viene con ejercicios comunes precargados con nomenclatura argentina:
- Sentadilla (y variantes: búlgara, goblet, frontal, etc.)
- Peso muerto (convencional, rumano, sumo, etc.)
- Press de banca (plano, inclinado, declinado)
- Press militar
- Remo con barra / mancuernas
- Dominadas / Jalón al pecho
- Fondos
- Hip thrust
- Estocadas / Zancadas
- Curl de bíceps (variantes)
- Extensión de tríceps (variantes)
- Elevaciones laterales
- Plancha (variantes)
- Vuelos / Aperturas
- Y más (biblioteca completa de ~100 ejercicios base)

El entrenador puede agregar/modificar ejercicios personalizados.

---

### Módulo 5: Planificación de Entrenamiento

#### Jerarquía de periodización

```
MACROCICLO (plan completo de un período)
├── fecha_inicio
├── fecha_fin_estimada
├── objetivo_general
│
├── MESOCICLO 1 (ej: "Introductorio", 4-6 semanas)
│   ├── nombre
│   ├── objetivo
│   ├── tipo (introductorio/desarrollador/estabilizador/recuperación)
│   │
│   ├── MICROCICLO 1 (1 semana típicamente)
│   │   ├── número
│   │   ├── tipo (introductorio/desarrollo/estabilización/descarga)
│   │   │
│   │   ├── SESIÓN 1
│   │   │   ├── número_sesión
│   │   │   ├── fecha_programada (opcional)
│   │   │   ├── lógica_entrenamiento (ej: "Mmss/Mmii/Pm específico")
│   │   │   ├── observaciones_generales
│   │   │   │
│   │   │   └── EJERCICIOS DE LA SESIÓN
│   │   │       ├── orden
│   │   │       ├── ejercicio_id
│   │   │       ├── etapa (movilidad/calentamiento/principal/etc)
│   │   │       ├── series
│   │   │       ├── repeticiones / tiempo
│   │   │       ├── intensidad (ver tabla abajo)
│   │   │       ├── descanso (segundos)
│   │   │       ├── observaciones
│   │   │       └── es_superserie_con (referencia a otro ejercicio)
│   │   │
│   │   ├── SESIÓN 2
│   │   └── SESIÓN N...
│   │
│   ├── MICROCICLO 2
│   └── MICROCICLO N...
│
├── MESOCICLO 2 (ej: "Desarrollador")
└── MESOCICLO N...
```

#### Sistema de intensidad

**Opción 1: RIR (Repeticiones en Reserva)**
| RIR | Descripción |
|-----|-------------|
| 4 | Podrías hacer 4 reps más |
| 3 | Podrías hacer 3 reps más |
| 2 | Podrías hacer 2 reps más |
| 1 | Podrías hacer 1 rep más |
| 0 | Fallo muscular |

**Opción 2: RPE (Rating of Perceived Exertion)**
| RPE | Descripción |
|-----|-------------|
| 6 | Muy liviano |
| 7 | Liviano |
| 8 | Moderado |
| 9 | Difícil |
| 10 | Máximo esfuerzo |

**Opción 3: Porcentaje de 1RM**
- 50%, 55%, 60%, 65%, 70%, 75%, 80%, 85%, 90%, 95%, 100%

El entrenador elige qué sistema usar por ejercicio o por plan completo.

#### Superseries
- Un ejercicio puede marcarse como "superserie con" otro ejercicio
- Se ejecutan consecutivamente sin descanso entre ellos
- Ilimitado: pueden encadenarse 2, 3 o más ejercicios

#### Objetivos
- **Largo plazo:** objetivo del macrociclo completo
- **Corto plazo:** objetivo por mesociclo o microciclo

#### Plantillas de planes
- El entrenador puede guardar un plan como plantilla
- Al crear nuevo plan: elegir "desde plantilla" o "desde cero"
- Las plantillas son globales para todo el gym

#### Bloqueo de etapas
- El entrenado solo ve el macrociclo actual
- Dentro del macrociclo, solo ve hasta el mesociclo actual
- El entrenador decide cuándo "desbloquear" el siguiente mesociclo
- Esto permite armar el plan progresivamente

---

### Módulo 6: Registro de Desempeño (Entrenado)

Cuando el entrenado completa una sesión, registra:

| Campo | Tipo |
|-------|------|
| Fecha/hora | datetime (auto) |
| Por cada ejercicio: | |
| - Peso utilizado (kg) | decimal |
| - Repeticiones realizadas | number |
| - Series completadas | number |
| - Intensidad percibida (RPE) | select 1-10 |
| - Descanso real (segundos) | number |
| - Completado | boolean |
| - Observaciones | text |
| Feedback general de la sesión | textarea |

#### Marcas de asistencia
- **Presente (P):** completó la sesión
- **Faltó (F):** no asistió
- **Parcial:** asistió pero no completó

---

### Módulo 7: Progresión y Estadísticas

#### Tipos de progresión configurables
El entrenador elige qué métrica seguir por entrenado:

| Tipo | Fórmula |
|------|---------|
| Tonelaje | (peso × reps × series) por sesión |
| Carga máxima | Mayor peso levantado por ejercicio |
| 1RM estimado | (kg × reps) × 0.03 + kg |
| AMRAP | Máximas reps con peso fijo |
| Volumen total | Total de reps por grupo muscular |

#### Gráficos disponibles
- Progresión de carga por ejercicio (línea temporal)
- Tonelaje por sesión/semana/mes
- Comparativa de 1RM estimado
- Asistencia (% de sesiones completadas)
- Distribución de volumen por grupo muscular

#### Estadísticas para el entrenador
- Dashboard con resumen de todos sus entrenados
- Alertas de entrenados con baja asistencia
- Progresión promedio del grupo
- Comparativas entre entrenados (anónimas)

---

### Módulo 8: Evaluaciones de Rendimiento

Evaluaciones a demanda que realiza el entrenador:

#### Tipos de evaluación predefinidos
| Tipo | Campos |
|------|--------|
| Test de Fuerza Máxima (1RM) | Ejercicio, peso logrado, fecha |
| Test de Resistencia | Ejercicio, reps a X peso, fecha |
| Test Aeróbico (Cooper) | Distancia en 12 min, fecha |
| Test Yo-Yo | Nivel alcanzado, fecha |
| Test de Flexibilidad | Zona evaluada, resultado, fecha |
| Evaluación personalizada | Nombre, descripción, valor, unidad, fecha |

#### Funcionalidad
- Crear evaluación nueva (elegir tipo o personalizar)
- Historial de evaluaciones por entrenado
- Comparativa entre evaluaciones (gráfico de evolución)
- El entrenado puede ver sus evaluaciones en su perfil

---

### Módulo 9: Sistema de Cuotas

#### Tipos de planes del gimnasio
| Campo | Tipo |
|-------|------|
| Nombre del plan | string |
| Descripción | text |
| Tipo | select: mensual_libre / semanal_2x / semanal_3x / pack_clases / personalizado |
| Cantidad de accesos | number (null = ilimitado) |
| Duración (días) | number (default: 30 días corridos) |
| Precio base | decimal |
| Activo | boolean |

#### Registro de cuota del entrenado
| Campo | Tipo |
|-------|------|
| Plan asignado | foreign key |
| Fecha inicio | date |
| Fecha vencimiento | date (calculada: inicio + duración) |
| Monto | decimal |
| Estado | enum: pendiente / pagado / vencido / mora |

#### Registro de pagos
| Campo | Tipo |
|-------|------|
| Cuota_id | foreign key |
| Fecha pago | datetime |
| Monto pagado | decimal |
| Método de pago | select: efectivo / transferencia / débito / crédito / otro |
| Comprobante | string (opcional) |
| Notas | text |

#### Moras
- Si fecha_vencimiento < hoy && estado != pagado → estado = mora
- Registro de días en mora
- Posibilidad de agregar recargo por mora (configurable por admin)

#### Aumentos de precio
- El admin puede registrar aumentos de precio por plan
- Se aplica a nuevas cuotas, no retroactivo
- Historial de precios por plan

#### Vista del entrenado
- Estado actual: "Al día" / "Debe" / "Vencido"
- Fecha de vencimiento
- Historial de pagos

---

### Módulo 10: Notificaciones por Email

#### Triggers de notificación
| Evento | Destinatario | Contenido |
|--------|--------------|-----------|
| Cuota por vencer (X días antes) | Entrenado | "Tu cuota vence el [fecha]" |
| Cuota vencida | Entrenado | "Tu cuota está vencida desde [fecha]" |
| Nuevo plan asignado | Entrenado | "Tenés un nuevo plan de entrenamiento" |
| Nueva etapa desbloqueada | Entrenado | "Se desbloqueó [mesociclo] en tu plan" |

#### Configuración
- Admin configura cuántos días antes avisar (ej: 5 días)
- Se puede activar/desactivar cada tipo de notificación
- Los emails incluyen logo y nombre del gym

#### Formato de emails
- Header con logo del gym
- Cuerpo con mensaje personalizado
- Footer con nombre del gym y datos de contacto
- Diseño responsive (mobile-friendly)

---

### Módulo 11: PDF del Plan

#### Contenido del PDF
- Logo y nombre del gimnasio
- Datos del entrenado (nombre, fecha)
- Solo la etapa actual desbloqueada (no todo el macrociclo)
- Por cada sesión:
  - Número de sesión
  - Lista de ejercicios con: series, reps, intensidad, descanso, observaciones
  - Espacio para registro manual (si imprime)

#### Formato
- Tamaño A4
- Diseñado para imprimir doble faz y doblar en 2 (formato librito)
- Orientación: a definir según mejor aprovechamiento

#### Funcionalidades
- Descargar desde perfil del entrenado
- Enviar por email desde perfil del entrenado
- El entrenador también puede generar/enviar el PDF

---

### Módulo 12: Links Adjuntos

El entrenador puede agregar links al perfil del entrenado:

| Campo | Tipo |
|-------|------|
| Título | string |
| URL | url |
| Descripción | text (opcional) |
| Categoría | select: video_técnica / artículo / recurso / otro |
| Fecha | datetime (auto) |

El entrenado ve estos links en su perfil para consulta posterior.

---

### Módulo 13: Feedback

#### Feedback del entrenador sobre el entrenado
| Campo | Tipo |
|-------|------|
| Fecha | datetime |
| Tipo | select: progreso / actitud / asistencia / técnica / otro |
| Contenido | textarea |
| Privado | boolean (si es true, solo lo ve el entrenador) |

#### Feedback del entrenado (por sesión)
- Se registra al completar cada sesión
- Campo de texto libre
- Visible para el entrenador en el historial

---

### Módulo 14: Auditoría

Registro automático de todas las acciones:

| Campo | Tipo |
|-------|------|
| Timestamp | datetime |
| Usuario_id | foreign key |
| Tipo usuario | enum: admin / entrenador / entrenado |
| Acción | string (create/update/delete/login/logout) |
| Entidad | string (entrenado/plan/cuota/etc) |
| Entidad_id | number |
| Datos anteriores | json |
| Datos nuevos | json |
| IP | string |

#### Acciones auditadas
- Login / Logout
- CRUD de entrenados
- CRUD de planes de entrenamiento
- Modificaciones a sesiones
- Pagos registrados
- Cambios en cuotas
- Evaluaciones
- Cambios de configuración

#### Acceso
- Solo Admin puede ver el log completo
- Entrenadores ven auditoría de sus propias acciones

---

### Módulo 15: Configuración del Gimnasio

#### Branding
| Campo | Tipo |
|-------|------|
| Nombre del gimnasio | string |
| Logo | image (PNG/JPG, max 2MB) |
| Color principal | color picker (hex) |
| Color secundario | color picker (hex) |
| Dirección | string |
| Teléfono | string |
| Email de contacto | string |
| Redes sociales | json (instagram, facebook, etc) |

#### Configuración de notificaciones
| Campo | Tipo |
|-------|------|
| Días antes para aviso de vencimiento | number |
| Notificar cuota por vencer | boolean |
| Notificar cuota vencida | boolean |
| Notificar nuevo plan | boolean |

El branding se aplica a:
- Header de la aplicación
- Emails
- PDFs

---

### Módulo 16: Modo Offline (PWA)

#### Funcionalidades offline para entrenado
- Ver plan del día actual (cacheado)
- La sesión actual se guarda localmente
- Cuando recupera conexión, sincroniza automáticamente

#### Implementación técnica
- Service Worker para cacheo
- IndexedDB para datos locales
- Sincronización en background cuando hay conexión
- Indicador visual de estado offline/online

#### Limitaciones offline
- No puede ver historial completo
- No puede descargar nuevos planes
- No recibe actualizaciones hasta sincronizar

---

### Módulo 17: Instalación Inicial

#### Primer inicio
1. Sistema detecta que no hay tablas en la DB
2. Ejecuta migraciones automáticamente
3. Carga seeders (ejercicios predefinidos)
4. Muestra wizard de configuración:
   - Nombre del gimnasio
   - Logo
   - Color principal
   - Crear usuario Admin (email, contraseña)
5. Redirige al dashboard

#### Variables de entorno requeridas
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=gym360
DB_USERNAME=
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

APP_URL=https://tudominio.com
```

---

## Fases de Desarrollo

### FASE 1: Core Funcional
**Prioridad: Alta | Base del sistema**

- [ ] Estructura del proyecto Laravel + React
- [ ] Sistema de autenticación (OTP entrenado / user-pass entrenador)
- [ ] Instalación automática (migraciones + wizard)
- [ ] Personalización básica (logo, nombre, color)
- [ ] CRUD de entrenadores
- [ ] CRUD de entrenados (datos básicos)
- [ ] Asignación entrenador-entrenado
- [ ] Biblioteca de ejercicios precargada
- [ ] CRUD de ejercicios y categorías
- [ ] Creación de planes (macro/meso/micro/sesiones)
- [ ] Sistema de plantillas de planes
- [ ] Vista del plan para entrenado (solo etapa actual)
- [ ] Carga de desempeño básica por sesión

### FASE 2: Gestión Completa
**Prioridad: Alta | Funcionalidades core**

- [ ] Sistema de cuotas completo
- [ ] Tipos de planes del gym
- [ ] Registro de pagos
- [ ] Moras y aumentos
- [ ] Anamnesis deportiva completa
- [ ] Evaluaciones de rendimiento
- [ ] Historial de evaluaciones
- [ ] Feedback entrenador-entrenado
- [ ] Links adjuntos al perfil
- [ ] Baja temporal de entrenados

### FASE 3: Reportes y Seguimiento
**Prioridad: Media | Valor agregado**

- [ ] PDF del plan (formato A4 doblado)
- [ ] Envío de PDF por email
- [ ] Gráficos de progresión
- [ ] Estadísticas por entrenado
- [ ] Dashboard del entrenador
- [ ] Auditoría completa
- [ ] Visualización de logs

### FASE 4: Optimización
**Prioridad: Media | Mejora UX**

- [ ] Notificaciones por email (cuota por vencer)
- [ ] Configuración de notificaciones
- [ ] Modo offline (ver plan del día)
- [ ] Sincronización offline
- [ ] Emails con branding completo
- [ ] Optimización de rendimiento

### FASE 5: Futuro
**Prioridad: Baja | Expansión**

- [ ] Huella dactilar (registro entrada/salida)
- [ ] Hardware integration
- [ ] App nativa iOS (Capacitor)
- [ ] App nativa Android (Capacitor)
- [ ] Push notifications nativas

---

## Estructura de Base de Datos (Esquema Simplificado)

```
users
├── id
├── email
├── password (null para entrenados)
├── role (admin/entrenador/entrenado)
├── nombre
├── apellido
├── dni
├── telefono
├── fecha_nacimiento
├── profesion
├── foto
├── estado (activo/baja_temporal/inactivo)
├── entrenador_asignado_id (FK users, null para entrenadores)
└── timestamps

gym_config
├── id
├── nombre
├── logo
├── color_principal
├── color_secundario
├── direccion
├── telefono
├── email
├── redes_sociales (json)
├── dias_aviso_vencimiento
├── notificar_vencimiento
├── notificar_nuevo_plan
└── timestamps

ejercicios
├── id
├── nombre
├── descripcion
├── video_url
├── etapas (json)
├── categorias_zona (json)
├── patrones_movimiento (json)
├── grupos_musculares (json)
├── es_global
├── created_by (FK users)
└── timestamps

macrociclos
├── id
├── entrenado_id (FK users)
├── fecha_inicio
├── fecha_fin_estimada
├── objetivo_general
├── activo
└── timestamps

mesociclos
├── id
├── macrociclo_id (FK)
├── numero
├── nombre
├── objetivo
├── tipo (introductorio/desarrollador/estabilizador/recuperacion)
├── desbloqueado
└── timestamps

microciclos
├── id
├── mesociclo_id (FK)
├── numero
├── tipo (introductorio/desarrollo/estabilizacion/descarga)
└── timestamps

sesiones
├── id
├── microciclo_id (FK)
├── numero
├── fecha_programada
├── logica_entrenamiento
├── observaciones
└── timestamps

sesion_ejercicios
├── id
├── sesion_id (FK)
├── ejercicio_id (FK)
├── orden
├── etapa
├── series
├── repeticiones
├── tiempo (segundos, alternativo a reps)
├── intensidad_tipo (rir/rpe/porcentaje)
├── intensidad_valor
├── descanso (segundos)
├── observaciones
├── superserie_con (FK sesion_ejercicios, null)
└── timestamps

registros_sesion
├── id
├── sesion_id (FK)
├── entrenado_id (FK users)
├── fecha
├── estado (completado/parcial/faltó)
├── feedback_general
└── timestamps

registros_ejercicio
├── id
├── registro_sesion_id (FK)
├── sesion_ejercicio_id (FK)
├── peso
├── repeticiones
├── series_completadas
├── intensidad_percibida
├── descanso_real
├── completado
├── observaciones
└── timestamps

anamnesis
├── id
├── entrenado_id (FK users)
├── peso
├── altura
├── medidas (json: hombros, torax, cintura, etc)
├── lesiones_previas
├── lesiones_actuales
├── cirugias
├── molestias
├── condiciones_medicas
├── medicacion
├── alergias
├── experiencia_gym
├── años_entrenamiento
├── deportes
├── frecuencia_actual
├── objetivos_principales
├── objetivos_secundarios
├── disponibilidad_dias
├── tiempo_por_sesion
├── ejercicios_contraindicados
├── limitaciones_movimiento
├── equipamiento_casa
├── notas
└── timestamps

evaluaciones
├── id
├── entrenado_id (FK users)
├── entrenador_id (FK users)
├── tipo
├── nombre
├── descripcion
├── valor
├── unidad
├── fecha
└── timestamps

planes_cuota
├── id
├── nombre
├── descripcion
├── tipo
├── cantidad_accesos
├── duracion_dias
├── precio
├── activo
└── timestamps

cuotas
├── id
├── entrenado_id (FK users)
├── plan_id (FK planes_cuota)
├── fecha_inicio
├── fecha_vencimiento
├── monto
├── estado (pendiente/pagado/vencido/mora)
└── timestamps

pagos
├── id
├── cuota_id (FK)
├── fecha
├── monto
├── metodo
├── comprobante
├── notas
└── timestamps

links_adjuntos
├── id
├── entrenado_id (FK users)
├── entrenador_id (FK users)
├── titulo
├── url
├── descripcion
├── categoria
└── timestamps

feedback
├── id
├── entrenado_id (FK users)
├── entrenador_id (FK users)
├── tipo
├── contenido
├── privado
└── timestamps

plantillas_plan
├── id
├── nombre
├── descripcion
├── estructura (json completa del plan)
├── created_by (FK users)
└── timestamps

audit_log
├── id
├── user_id (FK users)
├── user_type
├── action
├── entity
├── entity_id
├── old_data (json)
├── new_data (json)
├── ip
└── timestamp

otp_codes
├── id
├── user_id (FK users)
├── code
├── expires_at
├── used
└── timestamps
```

---

## API Endpoints (Estructura Base)

### Autenticación
```
POST   /api/auth/login              # Entrenador: email + password
POST   /api/auth/otp/request        # Entrenado: solicitar código
POST   /api/auth/otp/verify         # Entrenado: verificar código
POST   /api/auth/logout
POST   /api/auth/password/forgot
POST   /api/auth/password/reset
```

### Entrenadores (Admin)
```
GET    /api/entrenadores
POST   /api/entrenadores
GET    /api/entrenadores/{id}
PUT    /api/entrenadores/{id}
DELETE /api/entrenadores/{id}
```

### Entrenados
```
GET    /api/entrenados
POST   /api/entrenados
GET    /api/entrenados/{id}
PUT    /api/entrenados/{id}
DELETE /api/entrenados/{id}
PUT    /api/entrenados/{id}/baja-temporal
PUT    /api/entrenados/{id}/reactivar
PUT    /api/entrenados/{id}/asignar-entrenador
```

### Ejercicios
```
GET    /api/ejercicios
POST   /api/ejercicios
GET    /api/ejercicios/{id}
PUT    /api/ejercicios/{id}
DELETE /api/ejercicios/{id}
GET    /api/ejercicios/categorias
GET    /api/ejercicios/etapas
```

### Planes de entrenamiento
```
GET    /api/entrenados/{id}/planes
POST   /api/entrenados/{id}/planes
GET    /api/planes/{id}
PUT    /api/planes/{id}
DELETE /api/planes/{id}

GET    /api/planes/{id}/mesociclos
POST   /api/planes/{id}/mesociclos
PUT    /api/mesociclos/{id}
PUT    /api/mesociclos/{id}/desbloquear

GET    /api/mesociclos/{id}/microciclos
POST   /api/mesociclos/{id}/microciclos
PUT    /api/microciclos/{id}

GET    /api/microciclos/{id}/sesiones
POST   /api/microciclos/{id}/sesiones
PUT    /api/sesiones/{id}

GET    /api/sesiones/{id}/ejercicios
POST   /api/sesiones/{id}/ejercicios
PUT    /api/sesion-ejercicios/{id}
DELETE /api/sesion-ejercicios/{id}
```

### Plantillas
```
GET    /api/plantillas
POST   /api/plantillas
GET    /api/plantillas/{id}
DELETE /api/plantillas/{id}
POST   /api/plantillas/{id}/aplicar/{entrenado_id}
```

### Registros de desempeño
```
POST   /api/sesiones/{id}/registrar
GET    /api/entrenados/{id}/registros
GET    /api/registros/{id}
```

### Anamnesis
```
GET    /api/entrenados/{id}/anamnesis
POST   /api/entrenados/{id}/anamnesis
PUT    /api/anamnesis/{id}
```

### Evaluaciones
```
GET    /api/entrenados/{id}/evaluaciones
POST   /api/entrenados/{id}/evaluaciones
GET    /api/evaluaciones/{id}
PUT    /api/evaluaciones/{id}
DELETE /api/evaluaciones/{id}
```

### Cuotas y pagos
```
GET    /api/planes-cuota
POST   /api/planes-cuota
PUT    /api/planes-cuota/{id}
DELETE /api/planes-cuota/{id}

GET    /api/entrenados/{id}/cuotas
POST   /api/entrenados/{id}/cuotas
GET    /api/cuotas/{id}
PUT    /api/cuotas/{id}

POST   /api/cuotas/{id}/pagos
GET    /api/cuotas/{id}/pagos
```

### Links y feedback
```
GET    /api/entrenados/{id}/links
POST   /api/entrenados/{id}/links
DELETE /api/links/{id}

GET    /api/entrenados/{id}/feedback
POST   /api/entrenados/{id}/feedback
```

### Estadísticas
```
GET    /api/entrenados/{id}/estadisticas
GET    /api/entrenados/{id}/progresion
GET    /api/dashboard/entrenador
```

### PDF
```
GET    /api/entrenados/{id}/plan/pdf
POST   /api/entrenados/{id}/plan/enviar-email
```

### Configuración
```
GET    /api/config
PUT    /api/config
POST   /api/config/logo
```

### Auditoría (Admin)
```
GET    /api/audit
GET    /api/audit/user/{id}
GET    /api/audit/entity/{type}/{id}
```

---

## Convenciones de Código

### Backend (Laravel)
- PSR-12 coding standard
- Nombres de tablas en español, snake_case plural
- Nombres de modelos en español, PascalCase singular
- Controladores: `{Recurso}Controller`
- Requests: `{Accion}{Recurso}Request`
- Resources: `{Recurso}Resource`
- Policies: `{Recurso}Policy`

### Frontend (React)
- Componentes funcionales con hooks
- TypeScript obligatorio
- Carpeta structure:
  ```
  src/
  ├── components/
  │   ├── common/
  │   ├── entrenado/
  │   ├── entrenador/
  │   └── admin/
  ├── pages/
  ├── hooks/
  ├── services/
  ├── types/
  ├── utils/
  └── context/
  ```
- Nombres de componentes: PascalCase
- Nombres de hooks: camelCase con prefijo `use`
- Estado global: Context API (o Zustand si crece)

### Git
- Commits en español
- Formato: `tipo: descripción breve`
- Tipos: feat, fix, docs, style, refactor, test, chore
- Branches: `feature/nombre`, `fix/nombre`, `hotfix/nombre`

---

## Notas Adicionales

### Seguridad
- Todas las rutas de API protegidas con Sanctum
- CSRF protection en formularios
- Validación de inputs en backend
- Sanitización de outputs
- Rate limiting en OTP (máx 3 intentos por hora)
- Passwords hasheados con bcrypt

### Performance
- Eager loading en relaciones
- Paginación en listados
- Cache de configuración
- Lazy loading de componentes React
- Optimización de imágenes (logo)

### Accesibilidad
- Semantic HTML
- ARIA labels donde corresponda
- Contraste de colores WCAG AA
- Navegación por teclado

---

## Contacto del Proyecto

**Desarrolladores:**
- Infraestructura/Sistemas: [Tu nombre]
- Especialista en ejercicios: [Nombre de tu amigo]

**Repositorio:** [A definir]

---

*Documento generado para el desarrollo de Gym360. Mantener actualizado conforme avance el proyecto.*
