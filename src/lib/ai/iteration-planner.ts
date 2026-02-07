/**
 * Iteration Planner
 *
 * Planeja divisão de features em iterações baseado em score de complexidade.
 * Segue princípios: vertical slicing, dependências primeiro, core first.
 *
 * Especificação: docs/specification/ITERATIVE-MODEL.md
 */

import { getRecommendedIterations } from './complexity-analyzer';

interface TechnicalPlanSchema {
  models?: Array<{
    name: string;
    priority?: 'must-have' | 'should-have' | 'nice-to-have';
  }>;
}

interface TechnicalPlanAPI {
  routes?: Array<{
    path: string;
    method: string;
    dependencies?: string[];
    priority?: 'must-have' | 'should-have' | 'nice-to-have';
  }>;
}

interface TechnicalPlanIntegration {
  name: string;
  dependencies?: string[];
  priority?: 'must-have' | 'should-have' | 'nice-to-have';
  complexity?: 'low' | 'medium' | 'high';
}

interface TechnicalPlanUI {
  components?: string[];
}

interface TechnicalPlanInput {
  schema?: TechnicalPlanSchema;
  api?: TechnicalPlanAPI;
  integrations?: TechnicalPlanIntegration[];
  ui?: TechnicalPlanUI;
}

export interface Feature {
  name: string;
  description: string;
  type: 'schema' | 'api' | 'component' | 'integration' | 'test';
  dependencies?: string[]; // Features que devem vir antes
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  estimatedMinutes?: number;
}

export interface Iteration {
  number: number;
  name: string;
  description: string;
  features: Feature[];
  deliverables: string;
  estimatedMinutes: number;
}

export interface IterationPlan {
  strategy: 'SINGLE' | 'ITERATIVE';
  totalIterations: number;
  iterations: Iteration[];
  totalEstimatedMinutes: number;
}

/**
 * Extrai features do technical plan
 */
function extractFeaturesFromTechnicalPlan(technicalPlan: TechnicalPlanInput): Feature[] {
  const features: Feature[] = [];

  // Schema features
  if (technicalPlan.schema?.models) {
    for (const model of technicalPlan.schema.models) {
      features.push({
        name: `Schema: ${model.name}`,
        description: `Modelo de dados ${model.name}`,
        type: 'schema',
        priority: model.priority || 'must-have',
        estimatedMinutes: 2,
      });
    }
  }

  // API features
  if (technicalPlan.api?.routes) {
    for (const route of technicalPlan.api.routes) {
      features.push({
        name: `API: ${route.path}`,
        description: `Endpoint ${route.method} ${route.path}`,
        type: 'api',
        dependencies: route.dependencies || [],
        priority: route.priority || 'must-have',
        estimatedMinutes: 3,
      });
    }
  }

  // Integration features
  if (technicalPlan.integrations) {
    for (const integration of technicalPlan.integrations) {
      features.push({
        name: `Integração: ${integration.name}`,
        description: `Integração com ${integration.name}`,
        type: 'integration',
        dependencies: integration.dependencies || [],
        priority: integration.priority || 'should-have',
        estimatedMinutes: integration.complexity === 'high' ? 8 : 5,
      });
    }
  }

  // Component features
  if (technicalPlan.ui?.components) {
    for (const component of technicalPlan.ui.components) {
      features.push({
        name: `Componente: ${component}`,
        description: `Componente React ${component}`,
        type: 'component',
        priority: 'must-have',
        estimatedMinutes: 4,
      });
    }
  }

  return features;
}

/**
 * Divide features em grupos de iteração
 * Princípios:
 * 1. Vertical slicing (cada iteração = valor end-to-end)
 * 2. Dependências primeiro
 * 3. Core features em iterações iniciais
 */
function distributeFeatures(features: Feature[], iterationCount: number): Feature[][] {
  const groups: Feature[][] = Array.from({ length: iterationCount }, () => []);

  // Ordena features por prioridade e dependências
  const sortedFeatures = [...features].sort((a, b) => {
    // Prioridade: must-have > should-have > nice-to-have
    const priorityOrder = { 'must-have': 0, 'should-have': 1, 'nice-to-have': 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Features sem dependências primeiro
    const aDeps = a.dependencies?.length || 0;
    const bDeps = b.dependencies?.length || 0;
    return aDeps - bDeps;
  });

  // Distribui features entre iterações de forma balanceada
  let currentIteration = 0;
  for (const feature of sortedFeatures) {
    groups[currentIteration].push(feature);
    currentIteration = (currentIteration + 1) % iterationCount;
  }

  return groups;
}

/**
 * Cria plano de iterações para projeto SIMPLES (1 iteração)
 */
function createSingleIterationPlan(features: Feature[]): IterationPlan {
  const totalMinutes = features.reduce((sum, f) => sum + (f.estimatedMinutes || 5), 0);

  return {
    strategy: 'SINGLE',
    totalIterations: 1,
    totalEstimatedMinutes: totalMinutes,
    iterations: [
      {
        number: 1,
        name: 'MVP Completo',
        description: 'Implementação completa do projeto em uma única iteração',
        features,
        deliverables:
          'App completo com todas as funcionalidades, testado e deployado. URL pública .vercel.app com HTTPS.',
        estimatedMinutes: totalMinutes,
      },
    ],
  };
}

/**
 * Cria plano de iterações para projeto ITERATIVO (2+ iterações)
 */
function createIterativePlan(
  features: Feature[],
  iterationCount: number,
  _score: number
): IterationPlan {
  const groups = distributeFeatures(features, iterationCount);
  const iterations: Iteration[] = [];

  // Nomes sugeridos por número de iterações
  const iterationNames: Record<number, string[]> = {
    2: ['Fundação', 'Funcionalidades Completas'],
    3: ['Fundação', 'Core Features', 'Finalização'],
    4: ['Fundação', 'Módulo Principal', 'Integrações', 'Refinamento'],
    5: ['Base', 'Core', 'Integrações', 'Features Avançadas', 'Polimento'],
  };

  const names = iterationNames[iterationCount] || Array.from({ length: iterationCount }, (_, i) => `Fase ${i + 1}`);

  for (let i = 0; i < iterationCount; i++) {
    const featureGroup = groups[i];
    const estimatedMinutes = featureGroup.reduce((sum, f) => sum + (f.estimatedMinutes || 5), 0);

    iterations.push({
      number: i + 1,
      name: names[i] || `Iteração ${i + 1}`,
      description: `Implementação de ${featureGroup.length} features`,
      features: featureGroup,
      deliverables: `App funcional com ${featureGroup.map((f) => f.name).join(', ')}. Deploy automático em URL pública.`,
      estimatedMinutes,
    });
  }

  const totalMinutes = iterations.reduce((sum, it) => sum + it.estimatedMinutes, 0);

  return {
    strategy: 'ITERATIVE',
    totalIterations: iterationCount,
    iterations,
    totalEstimatedMinutes: totalMinutes,
  };
}

/**
 * Cria plano de iterações baseado no technical plan e complexity score
 */
export function planIterations(technicalPlan: TechnicalPlanInput, complexityScore: number): IterationPlan {
  const features = extractFeaturesFromTechnicalPlan(technicalPlan);
  const iterationCount = getRecommendedIterations(complexityScore);

  if (iterationCount === 1) {
    return createSingleIterationPlan(features);
  }

  return createIterativePlan(features, iterationCount, complexityScore);
}

/**
 * Gera plano de iterações customizado
 * Usado quando usuário quer ajustar número de iterações
 */
export function planCustomIterations(
  technicalPlan: TechnicalPlanInput,
  customIterationCount: number
): IterationPlan {
  const features = extractFeaturesFromTechnicalPlan(technicalPlan);

  if (customIterationCount === 1) {
    return createSingleIterationPlan(features);
  }

  return createIterativePlan(features, customIterationCount, 0);
}

/**
 * Simplifica escopo de uma iteração
 * Usado em caso de erro - divide iteração em partes menores
 */
export function simplifyIteration(iteration: Iteration): Iteration[] {
  const { features } = iteration;

  // Divide em 2 iterações menores
  const midpoint = Math.ceil(features.length / 2);
  const part1 = features.slice(0, midpoint);
  const part2 = features.slice(midpoint);

  return [
    {
      number: iteration.number,
      name: `${iteration.name} - Parte 1`,
      description: iteration.description,
      features: part1,
      deliverables: `${part1.map((f) => f.name).join(', ')}`,
      estimatedMinutes: part1.reduce((sum, f) => sum + (f.estimatedMinutes || 5), 0),
    },
    {
      number: iteration.number + 0.5, // Ex: 2.5
      name: `${iteration.name} - Parte 2`,
      description: iteration.description,
      features: part2,
      deliverables: `${part2.map((f) => f.name).join(', ')}`,
      estimatedMinutes: part2.reduce((sum, f) => sum + (f.estimatedMinutes || 5), 0),
    },
  ];
}
