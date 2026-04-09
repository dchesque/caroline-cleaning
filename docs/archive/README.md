# Documentation Archive

**Purpose**: Historical and reference documentation kept for context  
**Last Organized**: April 2026

This folder contains archived documentation that has been consolidated into the main documentation structure. These files are kept for historical reference and are not part of the current development workflow.

---

## Contents

### Implementation Phases (`phases/`)

Original implementation guides from project inception (Phases 1-8):

| File | Content | Status |
|------|---------|--------|
| `FASE_1_SETUP_INFRAESTRUTURA.md` | Initial setup and infrastructure | ✓ Completed |
| `FASE_2_DATABASE_SCHEMA.md` | Database design and migrations | ✓ Completed |
| `FASE_3_LANDING_PAGE_CHAT.md` | Landing page and chat widget | ✓ Completed |
| `FASE_4_PAINEL_ADMIN_CORE.md` | Admin panel core features | ✓ Completed |
| `FASE_5_PAINEL_ADMIN_MODULOS.md` | Admin modules (CRM, financials) | ✓ Completed |
| `FASE_6_INTEGRACAO_CAROL_N8N.md` | Carol AI and n8n integration | ✓ Completed |
| `FASE_7_ANALYTICS_RELATORIOS.md` | Analytics and reporting | ✓ Completed |
| `FASE_8_DEPLOY_PRODUCAO.md` | Production deployment | ✓ Completed |
| `PROMPT_IMPLANTACAO_CAROL_AI_NATIVA.md` | Carol AI implementation details | ✓ Reference |
| `PROMPT_CORRECOES_CAROL_AI_CODIGO.md` | Carol AI bug fixes | ✓ Reference |

**Why archived**: These were step-by-step guides used during development. Now consolidated into modern documentation structure.

**When to reference**: 
- Need context on historical decisions
- Understanding why certain patterns were chosen
- Researching how a feature was originally implemented

---

### Context Documentation (`context/`)

Original analysis documents generated during architecture phase:

| File | Content |
|------|---------|
| `architecture.md` | System architecture analysis |
| `data-flow.md` | Data flow diagrams and descriptions |
| `development-workflow.md` | Developer workflow guide |
| `glossary.md` | Project terminology |
| `project-overview.md` | High-level project overview |
| `security.md` | Security analysis and patterns |
| `testing-strategy.md` | Testing approach |
| `tooling.md` | Development tools reference |

**Why archived**: Content has been integrated into modern docs with better organization.

**When to reference**:
- Need detailed terminology definitions
- Understanding development workflow history
- Security patterns documentation

---

### Other Archived Files

| File | Reason |
|------|--------|
| `FLOWCHARTS_Chesque.md` | Consolidated into main feature docs |

---

## What Got Moved to Main Documentation

| Old Location | New Location | File |
|---|---|---|
| `docs/PRD_Chesque_Premium_Cleaning_v5.md` | `docs/PRD.md` | Renamed for clarity |
| `docs/ROTAS_TELAS_Chesque.md` | `docs/ROUTES_SCREENS.md` | Renamed, expanded with all current routes |
| `docs/SCHEMA_SUPABASE_Chesque.md` | `docs/DATABASE.md` | Renamed, updated schema |
| `docs/DESIGN_SYSTEM_Chesque.md` | `docs/DESIGN_SYSTEM.md` | Renamed |
| `docs/CAROL_AI.md` | `docs/features/CAROL_AI.md` | Moved to features folder |
| `.context/docs/*` | (integrated) | Content merged into main docs |
| `prompts/FASE_*` | `archive/phases/` | Archived for reference |

---

## How to Use Archive

### Finding Information

1. **Check main docs first** (`../README.md`)
2. **If not found**, search archive:
   - Historical context? → Check `phases/FASE_*.md`
   - Terminology? → Check `context/glossary.md`
   - Old patterns? → Check `context/architecture.md`

### Referencing Archive

When linking to archive:
```markdown
For historical context, see [Implementation Phase 1](archive/phases/FASE_1_SETUP_INFRAESTRUTURA.md)
```

### Before Updating Archive

- Archive is read-only (for reference only)
- Don't edit archived files
- If information is needed, move it to main docs
- Update main docs, not archive

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-09 | Initial archive created during doc consolidation |

---

## Migration Notes

**April 2026 Reorganization**:
- Consolidated 40+ scattered docs into organized structure
- Merged duplicate content
- Renamed for clarity and consistency
- Moved historical docs to archive
- Created new comprehensive guides
- Updated all cross-references

**Old Structure Problems**:
- Docs scattered across `docs/`, `prompts/`, `.context/`
- Duplicate information (routes in multiple places)
- Out-of-date historical implementation guides
- Hard to find current vs. historical info

**New Structure Benefits**:
- Single source of truth
- Clear hierarchy (main docs → features → archive)
- Current vs. historical clearly separated
- Easy navigation with index
- Reduced duplication

---

## Cleanup Completed

✓ Removed duplicate docs  
✓ Consolidated overlapping content  
✓ Renamed files for clarity  
✓ Organized by purpose  
✓ Created comprehensive index  
✓ Updated all internal links  

---

**Main Documentation Index**: [../README.md](../README.md)
