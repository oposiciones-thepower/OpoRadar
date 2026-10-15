# OpoRadar — versión pública marketing (preview de revisión)

Copia aislada de `oposiciones-thepower/OpoRadar`, basada en `2c3dd3f`, rama `codex/marketing-local`. No es un fork publicado en GitHub. Preview estática independiente publicada para revisión el 14/10/2026; la web y el backend originales no se modifican.

## Preview compartida — 14/10/2026

**Enlace para el equipo:** https://oporadar-revision-equipo.thepower-5217.chatgpt.site

Acceso público sin login autorizado por Nico. Hosting Sites corporativo ThePower, no Vercel personal. `noindex`/robots solicitan no indexar; no son control de acceso. Demo de 30 fichas, 16 CCAA, 116 rutas; formularios y métricas siguen simulados. No sincroniza el scraper ni modifica producción/BD/CRM.

- Exportador: `scripts/export-review-preview.mjs`. Copia solo build estático, elimina 30 enlaces internos a Sheets y conserva documentos oficiales; no sube código privado, .env, datos personales ni QA.
- Fuente aislada: `/Users/nmanzaneque/ThePower-ClaudeCode/outputs/oporadar-team-preview`.
- Site ID: `appgprj_6acf403be49481919864540e0a50c54a` (reutilizar; no crear otro para actualizar).
- Commit publicado: `037ef47bc3f7935568367a0a05f2d4f418aafed0`.
- QA anónimo alojado: 26 comprobaciones, 0 errores; `.local-qa/check-hosted.cjs` y `hosted-review-checks.json`.
- Para una siguiente versión: reconstruir y sanear exportación; seguir el flujo nativo Sites de guardar versión y desplegar el mismo Site. Nunca subir el checkout privado completo.

## Preview local

```sh
cd /Users/nmanzaneque/OpoRadar-marketing-local
npm run build:marketing
npm run serve:marketing
```

Abrir `http://127.0.0.1:4173/`. Si ya está arrancado, reutilizar el servidor. Desarrollo: `npm run dev:marketing`.

## Alcance implementado

- Portada con propuesta directa, buscador y dos recorridos: encontrar una oposición local o explorar alternativas desde AGE.
- Catálogo con filtros en URL: palabra clave, cuerpo, municipio, proximidad, acceso, tipo, estado, titulación, prueba y grupos 1–5 / 6–19 / 20+. Desconocidos separados, filtros rápidos y orden por plazas, fecha registrada o cercanía.
- Comparador de hasta tres procesos: acceso, requisitos, pruebas, tasas, plazas, plazos, programa y fuentes. Solo IDs en localStorage; no puntuación inventada de facilidad.
- Fichas con resumen para decidir, advertencias de promoción interna, fuentes/secciones del documento, bloques del programa, timeline de siete tipos de publicaciones y enlaces descriptivos. Enlace al organismo para contrastar inscripción: no es un envío de instancia.
- Páginas municipales/cuerpo con contexto específico, preguntas frecuentes, portales oficiales y municipios cercanos; tres guías de borrador y página Superadmin.
- Recorrido `/alternativas-age`: seleccionar cuerpo AGE y proceso local, consultar programa y requisitos. **Comparación exacta de cobertura pendiente**: no hay una edición del programa AGE vinculada; no se afirma coincidencia ni porcentaje.
- Tres formularios contextuales: alerta de zona, seguimiento de proceso y preparación (comercial o alumno). Simulaciones explícitas: no se guarda ni envía el email ni se genera material.
- `/preview-metricas`: contadores en memoria por intención, reiniciables y borrados al recargar. No usuarios únicos, leads, matrículas ni atribución real.
- 116 rutas HTML prerenderizadas con títulos, descripción y canonical. Sitemap excluye páginas personales/comparador/métricas. `noindex`, robots y cabecera de preview bloqueados: no desactivar para la preview.

## Datos y límites

**30 fichas estáticas de 27 municipios y 16 comunidades autónomas.** Se mantienen las 12 anteriores (8 de Registro único y 4 de Hallazgos boletines) y se añaden 18 de Hallazgos, copiadas el 14/10 desde `outputs/boletines-correccion-20261013/models.json` y `stage.json`, sin consultar ni modificar el Sheet. Se verificaron IDs, plazas, categorías, municipio, estado original, URLs y fila posterior al desglose. Evidencia QA local: `.local-qa/national-provenance.json`.

Comunidades representadas: Andalucía, Aragón, Asturias, Illes Balears, Canarias, Cantabria, Castilla y León, Castilla-La Mancha, Cataluña, Navarra, Comunitat Valenciana, Extremadura, Galicia, Madrid, País Vasco y Murcia. No es cobertura nacional exhaustiva. La portada destaca seis fichas de distintas comunidades; el directorio y filtros permiten recorrer las 30.

Snapshot **13/10/2026**, con revisiones de origen anteriores: no revisión actual de plazos ni catálogo completo listo para lanzamiento. No se inventan plazas, documentos o fechas; no se incorporan personas de las listas. Las bolsas con examen de Marratxí y Santa Cruz de Bezana se muestran como bolsa sin cupo fijo, no como una plaza. Gozón conserva `sourceState=abierta`, pero su plazo oficial terminó el 07/10: se presenta por verificar, con explicación. Barcarrota conserva la ventana oficial 05/10–03/11, marcada como dato del snapshot.

Los cupos no se duplican: Barcelona 67 corregidas (no 69 ni +5), Paracuellos 6 totales (no +2), Rivas 5 C1 y 7 C2 separadas. Santa Cruz de Tenerife es el proceso original de 2025 cerrado por caducidad, no la convocatoria sustituta de 2026. Las fases no localizadas siguen pendientes.

Cuatro fichas tienen enriquecimiento documental en `journey.ts`: Algete C1 y C2 (bases), Daganzo (bases) y Alcorcón L-005 (anexo del programa). Cada hecho incluye URL, sección y fecha de lectura 13/10. **Leer un PDF no acredita vigencia ni revisión de todas las rectificaciones.** Algete presenta numeración irregular de temas; Daganzo contiene una discrepancia sobre el número de ejercicios, señalada en la interfaz. Los importes/requisitos no encontrados siguen pendientes.

Proximidad: distancia en línea recta entre puntos municipales de referencia de seis municipios, con fuentes enlazadas. Los demás municipios no tienen coordenadas en esta muestra: mantienen sus fichas, sin distancias inventadas ni filtro de cercanía. No utiliza GPS, direcciones personales ni tiempo de desplazamiento. La fecha final de solicitud se extrae solo del intervalo de inscripción registrado, no de fechas de publicación embebidas.

## Arquitectura local

- `PublicSite.tsx`: rutas, estructura, catálogo y estado compartido.
- `features.tsx`: decisión, comparación, páginas locales/AGE, formularios y métricas.
- `journey.ts`: evidencia documental, filtros, fechas, distancias y validación de IDs.
- `context.tsx`: contrato de interacciones y contadores.
- `catalogue.ts` + `data/catalogue.json`: muestra, URLs territoriales dinámicas y metadata; conserva `/oposiciones/madrid/...` y rechaza localidades en una comunidad incorrecta.
- `prerender.tsx` + `scripts/prerender-marketing.mjs`: HTML estático por ruta. Enlaces con query se montan con createRoot porque el HTML prerenderizado no incluye sus filtros; resto mediante hidratación.

**Cambio de alcance confirmado 14/10:** no crear una base de datos ni un panel nuevos. OpoRadar ya tiene backend; esta entrega solo añade muestra al frontend.

La preview no consulta n8n, bases privadas, alumnos o CRM, ni genera temarios. Los servicios/context/config/OpoApp del upstream se conservan sin cambios y sin importarse desde la entrada pública. El área de alumno es informativa, no una integración. No hay dependencias nuevas.

## Verificación

```sh
npm run check:marketing
npm run build:marketing
npm run test:marketing
```

20 pruebas cubren límites de plazas, desconocidos, IDs, rutas/meta, fuentes, fechas, filtros con evidencia, distancias, orden, enlaces documentales, AGE y anclas del timeline. QA de navegador y capturas locales en `.local-qa/` (ignorado): `browser-national.cjs` (30 fichas + directorio/filtros territoriales) usa el Playwright ya instalado en `/Users/nmanzaneque/Web-Nico/node_modules/playwright`. Resultados al completar el recorrido: `browser-national-results.json`.

QA de esta ampliación: TypeScript, build, 20/20 pruebas y 126/126 comprobaciones de navegador, sin errores JavaScript ni peticiones externas. Capturas escritorio/móvil revisadas; evidencias en `.local-qa/browser-national-results.json` y `national-*.png`. La pasada anterior de 12 fichas conserva su resultado de 97 checks, no se confunde con la nueva.

Antes del lanzamiento definitivo o de conectar servicios: catálogo apto y actualizado, exclusiones, documentos ambiguos, programa AGE exacto, consentimientos/bajas, contratos CRM y validación editorial/comercial. El dominio confirmado es `https://www.oporadar.es/`; esta copia no modifica su web. Documentación y QA: proyecto Superadmin en Notion.

## Modo BD — 15/10/2026

Catálogo generado desde la BD de OpoRadar (Cloud SQL, schema `oporadar`), en lectura, al compilar. El navegador no conecta a la BD.

```sh
node --env-file=/Users/nmanzaneque/ThePower-ClaudeCode/.env scripts/export-db-catalogue.mjs   # o npm run export:db con OPORADAR_DATABASE_URI en .env.local
npm run build:marketing:db   # VITE_CATALOGUE=db
npm run serve:marketing
```

- Fuente: `registro_unico` (597) + `hallazgos_boletines` sin `excluida`/`duplicado` (306) = 903 fichas, 1859 rutas. Las 30 fichas de la muestra revisada prevalecen sobre la BD.
- Salida: `src/public-site/data/catalogue.db.json`. `npm run build:marketing` (sin flag) sigue usando la muestra de 30 y los tests (`test:marketing`) siguen apuntando a ella.
- **Limitación:** el import de la BD perdió los hipervínculos del Sheet; solo 128 fichas tienen algún enlace a documento y 499 no tienen portal. Se muestra "Enlace oficial pendiente de localizar". Pendiente reimport con enlaces (Dev Team).
- Pendiente: paginar `/convocatorias` (renderiza todas las tarjetas) y aligerar el bundle (~2,6 MB sin comprimir con 903 fichas).
