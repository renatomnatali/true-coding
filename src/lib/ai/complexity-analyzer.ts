/**
 * Complexity Analyzer
 *
 * Analisa protótipos aprovados e calcula score de complexidade para determinar
 * estratégia de iterações (1 iteração vs múltiplas iterações).
 *
 * Especificação: docs/specification/ITERATIVE-MODEL.md
 */

export interface ComplexityScore {
  // Individual scores (0-5)
  schema: number;
  integrations: number;
  realTime: number;
  ui: number;
  auth: number;

  // Weighted total (0-100)
  total: number;

  // Classification
  classification: 'SIMPLES' | 'MÉDIO' | 'COMPLEXO' | 'MUITO_COMPLEXO';

  // Details for transparency
  details: {
    schema: string;
    integrations: string;
    realTime: string;
    ui: string;
    auth: string;
  };
}

interface SchemaField {
  name: string;
  type: string;
}

interface SchemaRelation {
  name: string;
  type: string;
  model: string;
}

interface SchemaModel {
  name: string;
  fields?: SchemaField[];
  relations?: SchemaRelation[];
}

interface Integration {
  name: string;
  type?: string;
  complexity?: string;
}

interface Feature {
  name: string;
  requiresRealTime?: boolean;
}

interface UIConfig {
  complexity?: string;
  components?: string[];
}

interface AuthConfig {
  provider?: string;
  roles?: string[];
  multiProvider?: boolean;
  complexity?: string;
}

interface SchemaConfig {
  models?: SchemaModel[];
}

export interface ComplexityAnalysisInput {
  technicalPlan: {
    schema?: SchemaConfig;
    integrations?: Integration[];
    features?: Feature[];
    ui?: UIConfig;
    auth?: AuthConfig;
  };
  prototypeHtml?: string; // Optional: para análise extra do HTML
}

/**
 * Analisa complexidade do schema de dados
 * Peso: 35%
 */
function analyzeSchemaComplexity(schema?: SchemaConfig): { score: number; detail: string } {
  if (!schema?.models || schema.models.length === 0) {
    return { score: 1, detail: '1-2 entidades' };
  }

  const modelCount = schema.models.length;

  // Conta relações complexas
  let complexRelations = 0;
  for (const model of schema.models) {
    if (model.relations) {
      for (const rel of model.relations) {
        if (rel.type === 'many-to-many' || rel.type === 'self-referential') {
          complexRelations++;
        }
      }
    }
  }

  if (modelCount <= 2) {
    return { score: 1, detail: `${modelCount} entidades` };
  } else if (modelCount <= 4) {
    return { score: 2, detail: `${modelCount} entidades, relações simples` };
  } else if (modelCount <= 7) {
    return { score: 3, detail: `${modelCount} entidades, relações médias` };
  } else if (modelCount <= 12) {
    return { score: 4, detail: `${modelCount} entidades, múltiplas relações` };
  } else {
    return {
      score: 5,
      detail: `${modelCount} entidades, relações complexas${complexRelations > 0 ? ` (${complexRelations} many-to-many)` : ''}`,
    };
  }
}

/**
 * Analisa complexidade de integrações externas
 * Peso: 25%
 */
function analyzeIntegrationsComplexity(integrations?: Integration[]): { score: number; detail: string } {
  if (!integrations || integrations.length === 0) {
    return { score: 0, detail: 'Nenhuma integração' };
  }

  const count = integrations.length;

  // Conta integrações complexas (webhooks, APIs customizadas)
  const complexCount = integrations.filter(
    (int) =>
      int.complexity === 'high' ||
      int.type === 'webhook' ||
      int.name?.toLowerCase().includes('custom')
  ).length;

  if (count === 1) {
    return { score: 1, detail: `${integrations[0].name}` };
  } else if (count <= 3) {
    return { score: 2, detail: `${count} integrações: ${integrations.map((i) => i.name).join(', ')}` };
  } else if (count <= 5) {
    return { score: 3, detail: `${count} integrações${complexCount > 0 ? ` (${complexCount} complexas)` : ''}` };
  } else {
    return { score: 4, detail: `${count} integrações com webhooks/APIs customizadas` };
  }
}

/**
 * Analisa features real-time
 * Peso: 20%
 */
function analyzeRealTimeComplexity(features?: Feature[]): { score: number; detail: string } {
  if (!features || features.length === 0) {
    return { score: 0, detail: 'Sem real-time' };
  }

  const realTimeFeatures = features.filter((f) => f.requiresRealTime === true);
  const count = realTimeFeatures.length;

  if (count === 0) {
    return { score: 0, detail: 'Sem real-time' };
  } else if (count === 1) {
    return { score: 2, detail: `1 feature: ${realTimeFeatures[0].name}` };
  } else if (count <= 2) {
    return { score: 3, detail: `${count} features real-time` };
  } else {
    return { score: 4, detail: `${count} features real-time (chat, tracking, notifications)` };
  }
}

/**
 * Analisa complexidade de UI
 * Peso: 15%
 */
function analyzeUIComplexity(ui?: UIConfig): { score: number; detail: string } {
  if (!ui) {
    return { score: 1, detail: 'UI simples' };
  }

  const complexityLevel = ui.complexity?.toLowerCase();
  const componentCount = ui.components?.length || 0;

  if (complexityLevel === 'very_high' || componentCount > 30) {
    return { score: 4, detail: 'UI muito complexa (editor visual, canvas)' };
  } else if (complexityLevel === 'high' || componentCount > 20) {
    return { score: 3, detail: 'UI complexa (drag-and-drop, modals aninhados)' };
  } else if (complexityLevel === 'medium' || componentCount > 10) {
    return { score: 2, detail: 'UI moderada (dashboards, filtros, tabs)' };
  } else {
    return { score: 1, detail: 'UI simples (formulários, listas)' };
  }
}

/**
 * Analisa complexidade de autenticação
 * Peso: 5%
 */
function analyzeAuthComplexity(auth?: AuthConfig): { score: number; detail: string } {
  if (!auth || !auth.provider) {
    return { score: 0, detail: 'Sem autenticação' };
  }

  const roles = auth.roles?.length || 0;
  const multiProvider = auth.multiProvider === true;

  if (roles >= 4 || auth.complexity === 'high') {
    return { score: 3, detail: `RBAC complexo (${roles} roles)` };
  } else if (multiProvider || roles >= 2) {
    return { score: 2, detail: `Multi-role (${roles} roles)` };
  } else {
    return { score: 1, detail: `Auth básico (${auth.provider})` };
  }
}

/**
 * Calcula classificação baseada no score
 */
function getClassification(score: number): ComplexityScore['classification'] {
  if (score <= 30) return 'SIMPLES';
  if (score <= 55) return 'MÉDIO';
  if (score <= 75) return 'COMPLEXO';
  return 'MUITO_COMPLEXO';
}

/**
 * Analisa complexidade de um projeto
 */
export function analyzeComplexity(input: ComplexityAnalysisInput): ComplexityScore {
  const { technicalPlan } = input;

  // Calcula scores individuais
  const schemaResult = analyzeSchemaComplexity(technicalPlan.schema);
  const integrationsResult = analyzeIntegrationsComplexity(technicalPlan.integrations);
  const realTimeResult = analyzeRealTimeComplexity(technicalPlan.features);
  const uiResult = analyzeUIComplexity(technicalPlan.ui);
  const authResult = analyzeAuthComplexity(technicalPlan.auth);

  // Calcula score ponderado (0-5)
  const weightedScore =
    schemaResult.score * 0.35 +
    integrationsResult.score * 0.25 +
    realTimeResult.score * 0.2 +
    uiResult.score * 0.15 +
    authResult.score * 0.05;

  // Normaliza para 0-100
  const normalizedScore = Math.round((weightedScore / 5) * 100);

  return {
    schema: schemaResult.score,
    integrations: integrationsResult.score,
    realTime: realTimeResult.score,
    ui: uiResult.score,
    auth: authResult.score,
    total: normalizedScore,
    classification: getClassification(normalizedScore),
    details: {
      schema: schemaResult.detail,
      integrations: integrationsResult.detail,
      realTime: realTimeResult.detail,
      ui: uiResult.detail,
      auth: authResult.detail,
    },
  };
}

/**
 * Determina número recomendado de iterações baseado no score
 */
export function getRecommendedIterations(score: number): number {
  if (score <= 30) return 1;
  if (score <= 40) return 2;
  if (score <= 55) return 3;
  if (score <= 65) return 4;
  if (score <= 75) return 5;
  return 6; // Muito complexo
}

/**
 * Determina estratégia (SINGLE vs ITERATIVE)
 */
export function getIterationStrategy(score: number): 'SINGLE' | 'ITERATIVE' {
  return score <= 30 ? 'SINGLE' : 'ITERATIVE';
}
