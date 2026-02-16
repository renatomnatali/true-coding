import { describe, it, expect } from 'vitest'
import Handlebars from 'handlebars'
import { loadTemplate, renderTemplate, kebabCase, TemplateContext } from './templates'

describe('Template Helpers', () => {
  describe('pascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      const template = Handlebars.compile('{{pascalCase name}}')
      expect(template({ name: 'my-component' })).toBe('MyComponent')
    })

    it('should convert snake_case to PascalCase', () => {
      const template = Handlebars.compile('{{pascalCase name}}')
      expect(template({ name: 'my_component' })).toBe('MyComponent')
    })

    it('should handle empty string', () => {
      const template = Handlebars.compile('{{pascalCase name}}')
      expect(template({ name: '' })).toBe('')
    })
  })

  describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      const template = Handlebars.compile('{{camelCase name}}')
      expect(template({ name: 'my-variable' })).toBe('myVariable')
    })

    it('should convert PascalCase to camelCase', () => {
      const template = Handlebars.compile('{{camelCase name}}')
      expect(template({ name: 'MyVariable' })).toBe('myvariable')
    })
  })

  describe('kebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(kebabCase('MyComponent')).toBe('my-component')
    })

    it('should convert spaces to hyphens', () => {
      expect(kebabCase('My Component')).toBe('my-component')
    })

    it('should convert underscores to hyphens', () => {
      expect(kebabCase('my_component')).toBe('my-component')
    })
  })

  describe('eq helper', () => {
    it('should return true for equal values', () => {
      const template = Handlebars.compile('{{#if (eq a b)}}yes{{else}}no{{/if}}')
      expect(template({ a: 'test', b: 'test' })).toBe('yes')
    })

    it('should return false for different values', () => {
      const template = Handlebars.compile('{{#if (eq a b)}}yes{{else}}no{{/if}}')
      expect(template({ a: 'test', b: 'other' })).toBe('no')
    })
  })
})

describe('renderTemplate', () => {
  const baseContext: TemplateContext = {
    projectName: 'Test Project',
    projectSlug: 'test-project',
    description: 'A test project',
    features: ['feature1', 'feature2'],
    hasDatabase: true,
    hasAuth: false,
    entities: [],
    pages: [],
    components: [],
  }

  it('should render project name', () => {
    const template = '{{projectName}}'
    const result = renderTemplate(template, baseContext)
    expect(result).toBe('Test Project')
  })

  it('should render conditional for hasDatabase', () => {
    const template = '{{#if hasDatabase}}HAS_DB{{else}}NO_DB{{/if}}'
    expect(renderTemplate(template, baseContext)).toBe('HAS_DB')
    expect(renderTemplate(template, { ...baseContext, hasDatabase: false })).toBe('NO_DB')
  })

  it('should render conditional for hasAuth', () => {
    const template = '{{#if hasAuth}}HAS_AUTH{{else}}NO_AUTH{{/if}}'
    expect(renderTemplate(template, baseContext)).toBe('NO_AUTH')
    expect(renderTemplate(template, { ...baseContext, hasAuth: true })).toBe('HAS_AUTH')
  })

  it('should iterate over features', () => {
    const template = '{{#each features}}{{this}},{{/each}}'
    const result = renderTemplate(template, baseContext)
    expect(result).toBe('feature1,feature2,')
  })

  it('includes jest-dom dependency required by generated vitest setup', async () => {
    const packageTemplate = await loadTemplate('nextjs-basic/package.json.hbs')
    const renderedPackage = renderTemplate(packageTemplate, baseContext)
    const parsed = JSON.parse(renderedPackage) as {
      devDependencies?: Record<string, string>
    }

    expect(parsed.devDependencies?.['@testing-library/jest-dom']).toBeDefined()
  })
})
