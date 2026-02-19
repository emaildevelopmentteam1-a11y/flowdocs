# FlowDocs — EXPAND
> Profundiza en un módulo específico que quedó incompleto en el DISCOVER inicial.

---

## USO

```
@expand.md --module=pos
@expand.md --module=cash --read=app/services/cash_register_service.rb
@expand.md --story=US-004
```

---

## CUÁNDO USARLO

- Después de DISCOVER cuando un módulo tiene menos flujos de los esperados
- Cuando sabes que hay funcionalidad compleja en un módulo que no quedó bien documentada
- Cuando agregas un módulo nuevo al proyecto
- Cuando el DISCOVER documentó la superficie pero faltó profundidad

---

## LO QUE DEBES HACER

1. **Lee `.flowdocs/flows.yaml`** — entiende lo que ya está documentado del módulo
2. **Lee el código del módulo** — controladores, servicios, modelos, componentes
3. **Compara** — qué flujos existen en el código pero no en el YAML
4. **Genera los flujos faltantes** en el mismo formato que los existentes
5. **Actualiza el YAML** — agrega los flujos nuevos, actualiza los stats, asigna IDs continuando la secuencia existente

---

## REGLAS

- **No modifiques flujos existentes** a menos que estén claramente mal
- **Los IDs continúan la secuencia** — si el último es FLOW-015, el nuevo es FLOW-016
- **Mantén el mismo nivel de detalle** que los flujos existentes en el YAML
- **Crea stories nuevas** si los flujos nuevos no encajan en ninguna existente
- **Actualiza los `flow_ids`** de las stories afectadas

---

## ENTREGA

1. Lista de flujos nuevos encontrados con su justificación
2. El YAML actualizado con los flujos nuevos integrados
3. Stats recalculados
