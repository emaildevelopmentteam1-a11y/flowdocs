# FlowDocs — AUDIT
> Revisa `.flowdocs/flows.yaml` y el código del proyecto. Encuentra todo lo que está mal, incompleto o inconsistente.

---

## USO

```
@audit.md                        — auditoría completa
@audit.md --module=pos           — solo el módulo POS
@audit.md --focus=tests          — solo cobertura de tests
@audit.md --focus=critical       — solo flujos críticos
```

---

## LO QUE DEBES HACER

Lee `.flowdocs/flows.yaml` completo y el código del proyecto. Luego reporta:

### 1. Inconsistencias YAML vs Código

Flujos marcados como `implemented` pero cuyo código no existe o está incompleto.
Flujos marcados como `test_status: covered` pero sin archivos de test reales.
Tasks marcadas como `done` pero cuyo código no refleja eso.

### 2. Flujos críticos sin tests

Lista todos los flujos con `priority: critical` y `test_status: none`.
Ordénalos por riesgo — los que afectan dinero o datos primero.

### 3. Huecos de documentación

Flujos con `steps` vacíos o con menos de 3 pasos.
Flujos sin `preconditions` ni `postconditions`.
Flujos sin diagrama Mermaid.
Entidades sin transiciones definidas.

### 4. Flujos que faltan

Basándote en el código, ¿hay funcionalidad implementada que NO está en el YAML?
Si encuentras rutas, controladores o componentes sin flujo correspondiente, documéntalos.

### 5. Stats incorrectos

Recalcula los stats del `meta` y compáralos con los actuales. Si difieren, muestra cuáles están mal.

---

## FORMATO DEL REPORTE

```
## AUDITORÍA FLOWDOCS — [fecha]

### 🔴 Crítico (bloquea trabajo con IA)
- FLOW-003: marcado como implemented pero SaleService no existe en el código
- Stats incorrectos: implemented dice 7 pero hay 9 en el código

### 🟡 Importante (genera confusión)
- FLOW-003, FLOW-011: test_status: covered pero no hay archivos de test
- FLOW-007: solo tiene 2 pasos, falta describir la validación de stock

### 🟢 Menor (mejora la calidad)
- FLOW-004, FLOW-009: sin diagrama Mermaid
- US-003: historia sin descripción de beneficio

### 📊 Stats reales vs documentados
| Campo | YAML dice | Real |
|-------|-----------|------|
| implemented | 7 | 9 |
| with_tests | 4 | 3 |
| coverage_pct | 27% | 20% |

### 🔍 Funcionalidad sin documentar
- src/controllers/reports_controller.rb — no hay ningún flujo de reportes en el YAML
```

---

## REGLAS

- **No modifiques el YAML** durante la auditoría — solo reporta
- **Sé específico** — no "hay flujos sin tests", sino "FLOW-003, FLOW-011, FLOW-013 no tienen tests"
- **Prioriza por impacto** — lo que rompe el trabajo con IA va primero
- **Si no puedes verificar algo** sin leer un archivo específico, pídelo

---

## SECUENCIA FINAL (orden y estructura)

1. **Orden:** Lee flows.yaml completo y el código relevante → agrupa hallazgos por severidad (crítico, importante, menor) → reporta con IDs concretos y stats reales vs documentados. No edites el YAML.
2. **Estructura del reporte:** Usa el formato de ejemplo (secciones por severidad, tabla stats, lista de funcionalidad sin documentar). El usuario puede usar @update.md para corregir; tras aplicar cambios, recargar el viewer para ver el estado actualizado.
3. **Para el viewer:** La auditoría no cambia el YAML. Cuando el usuario corrija con @update.md, deberá recargar el viewer (Recargar o `flowdocs open`).
