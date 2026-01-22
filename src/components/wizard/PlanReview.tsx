'use client'

import type { BusinessPlan } from '@/types'
import { Button } from '@/components/ui/button'
import { Check, Pencil } from 'lucide-react'

interface PlanReviewProps {
  plan: BusinessPlan
  onConfirm: () => void
  onEdit: () => void
}

export function PlanReview({ plan, onConfirm, onEdit }: PlanReviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{plan.name}</h2>
        <p className="text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="space-y-4">
        <Section title="Descricao">
          <p>{plan.description}</p>
        </Section>

        <Section title="Problema">
          <p>{plan.problemStatement}</p>
        </Section>

        <Section title="Publico-alvo">
          <p>
            <strong>Principal:</strong> {plan.targetAudience.primary}
          </p>
          {plan.targetAudience.secondary && (
            <p>
              <strong>Secundario:</strong> {plan.targetAudience.secondary}
            </p>
          )}
          <div className="mt-2">
            <strong>Pain Points:</strong>
            <ul className="list-disc list-inside ml-2">
              {plan.targetAudience.painPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Funcionalidades Essenciais">
          <ul className="space-y-2">
            {plan.coreFeatures.map((feature) => (
              <li key={feature.id} className="border rounded-lg p-3">
                <div className="font-medium">{feature.name}</div>
                <div className="text-sm text-muted-foreground">
                  {feature.description}
                </div>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className="rounded bg-primary/10 px-2 py-0.5">
                    {feature.priority}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5">
                    {feature.complexity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {plan.niceToHaveFeatures.length > 0 && (
          <Section title="Nice to Have">
            <ul className="list-disc list-inside">
              {plan.niceToHaveFeatures.map((feature) => (
                <li key={feature.id}>{feature.name}</li>
              ))}
            </ul>
          </Section>
        )}

        {plan.monetization && (
          <Section title="Monetizacao">
            <p>
              <strong>Modelo:</strong> {plan.monetization.model}
            </p>
            <p>{plan.monetization.description}</p>
          </Section>
        )}

        {plan.competitors && plan.competitors.length > 0 && (
          <Section title="Concorrentes">
            <ul className="space-y-1">
              {plan.competitors.map((comp, i) => (
                <li key={i}>
                  <strong>{comp.name}:</strong> {comp.differentiator}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Metricas de Sucesso">
          <ul className="space-y-1">
            {plan.successMetrics.map((metric, i) => (
              <li key={i}>
                <strong>{metric.name}:</strong> {metric.target} ({metric.timeframe})
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Ajustar
        </Button>
        <Button onClick={onConfirm}>
          <Check className="h-4 w-4 mr-2" />
          Confirmar Plano
        </Button>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  )
}
