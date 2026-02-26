---
name: Frontend Design
description: Diseño de interfaces frontend production-grade con estética distintiva y memorable.
---

# SKILL: Frontend Design
> Diseño de interfaces frontend production-grade con estética distintiva y memorable.

---

## Cuándo activar esta skill

Cuando el usuario pida:
- Componentes UI, páginas, dashboards, layouts
- Rediseñar o mejorar una interfaz existente
- HTML/CSS/JS, React, o cualquier componente visual
- "Hazme una vista para...", "Diseña una pantalla de...", "Crea un componente de..."

---

## Antes de escribir código — Define la dirección

Antes de generar cualquier cosa, responde estas preguntas internamente:

1. **¿Qué problema resuelve esta interfaz?** ¿Quién la usa y en qué contexto?
2. **¿Qué tono tiene?** Elige uno y ejecútalo con precisión:
   - Brutalmente minimal
   - Industrial / utilitario (dark, denso, datos)
   - Editorial / revista
   - Retro-futurista
   - Orgánico / natural
   - Luxury / refinado
   - Playful / toy-like
   - Brutalista / raw
3. **¿Qué va a hacer que esta interfaz sea INOLVIDABLE?** Define una cosa concreta.

**Nunca generes sin una dirección clara. Bold y minimal ambos funcionan — lo que no funciona es no tener punto de vista.**

---

## Reglas de implementación

### Tipografía
- Usa fuentes con carácter — evita Inter, Roboto, Arial, system-ui
- Combina una display font distintiva con una body font refinada
- Google Fonts está disponible, úsalo bien
- Ejemplos buenos: Sora + JetBrains Mono, Fraunces + DM Sans, Cabinet Grotesk + Instrument Serif

### Color
- Usa CSS variables para consistencia
- Un color dominante con acentos sharp supera paletas tímidas y distribuidas
- Commits al tema: dark industrial, cream editorial, neon brutalista — no mezcles sin razón

### Movimiento
- Micro-interacciones en momentos de alto impacto (load, hover, transición)
- Un page load bien orquestado con staggered reveals vale más que animaciones dispersas
- CSS-only para HTML puro. Motion library para React cuando esté disponible

### Composición espacial
- Layouts inesperados — asimetría, overlap, elementos que rompen el grid
- Espacio negativo generoso O densidad controlada — no el término medio tibio
- Fondos con atmósfera: gradient mesh, noise texture, patrones geométricos, grain overlay

### Código
- Production-grade y funcional — no solo bonito
- Cohesivo — cada detalle apoya la dirección estética elegida
- Sin dead code ni placeholders — todo lo que se ve funciona

---

## Lo que NUNCA hacer

- ❌ Gradientes purple sobre fondo blanco
- ❌ Cards genéricas con sombra suave y border-radius estándar
- ❌ Inter / Roboto / Arial como tipografía principal
- ❌ Layouts predecibles sin punto de vista
- ❌ Diseños que podrían ser de cualquier proyecto — debe sentirse hecho para ESTE contexto

---

## Stack preferido de Martin

Cuando no se especifique otro stack, usar:
- **Tailwind CSS** para utilidades
- **Preline UI** para componentes base
- **Dark mode** como default
- **JetBrains Mono** para datos/código, **Sora** para UI general
- Paleta base: `#0a0a0f` fondo, `#6366f1` acento primario, `#e2e8f0` texto

---

## Entrega

1. Código completo y funcional — no fragmentos
2. Comentarios solo donde la lógica no es obvia
3. Si tomaste decisiones de diseño no obvias, explica en 1 línea por qué
