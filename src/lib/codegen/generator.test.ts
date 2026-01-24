import { describe, it, expect } from 'vitest'
import { sanitizePath, sanitizeGeneratedFiles } from './generator'

describe('sanitizePath', () => {
  describe('valid paths', () => {
    it('should accept simple file paths', () => {
      expect(sanitizePath('src/index.ts')).toBe('src/index.ts')
      expect(sanitizePath('package.json')).toBe('package.json')
      expect(sanitizePath('src/components/Button.tsx')).toBe(
        'src/components/Button.tsx'
      )
    })

    it('should normalize leading ./ to remove it', () => {
      expect(sanitizePath('./src/index.ts')).toBe('src/index.ts')
      expect(sanitizePath('./package.json')).toBe('package.json')
    })

    it('should normalize multiple slashes', () => {
      expect(sanitizePath('src//components///Button.tsx')).toBe(
        'src/components/Button.tsx'
      )
    })

    it('should accept hidden files', () => {
      expect(sanitizePath('.gitignore')).toBe('.gitignore')
      expect(sanitizePath('.env.example')).toBe('.env.example')
      expect(sanitizePath('src/.hidden')).toBe('src/.hidden')
    })

    it('should trim whitespace', () => {
      expect(sanitizePath('  src/index.ts  ')).toBe('src/index.ts')
    })
  })

  describe('path traversal attacks', () => {
    it('should reject paths with .. components', () => {
      expect(sanitizePath('../etc/passwd')).toBeNull()
      expect(sanitizePath('src/../../../etc/passwd')).toBeNull()
      expect(sanitizePath('..\\windows\\system32')).toBeNull()
      expect(sanitizePath('foo/bar/../../../etc/passwd')).toBeNull()
    })

    it('should reject absolute paths starting with /', () => {
      expect(sanitizePath('/etc/passwd')).toBeNull()
      expect(sanitizePath('/home/user/.ssh/id_rsa')).toBeNull()
    })

    it('should reject Windows absolute paths', () => {
      expect(sanitizePath('C:/Windows/System32')).toBeNull()
      expect(sanitizePath('D:\\Users\\Admin')).toBeNull()
    })

    it('should reject null byte injection', () => {
      expect(sanitizePath('src/file.ts\0.txt')).toBeNull()
      expect(sanitizePath('package.json\0malicious')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should reject empty paths', () => {
      expect(sanitizePath('')).toBeNull()
      expect(sanitizePath('   ')).toBeNull()
    })

    it('should reject just . or ..', () => {
      expect(sanitizePath('.')).toBeNull()
      expect(sanitizePath('..')).toBeNull()
    })
  })
})

describe('sanitizeGeneratedFiles', () => {
  it('should filter out files with invalid paths', () => {
    const files = [
      { path: 'src/valid.ts', content: 'valid' },
      { path: '../malicious.ts', content: 'malicious' },
      { path: 'src/another.ts', content: 'another' },
      { path: '/etc/passwd', content: 'absolute' },
    ]

    const result = sanitizeGeneratedFiles(files)

    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('src/valid.ts')
    expect(result[1].path).toBe('src/another.ts')
  })

  it('should normalize valid paths', () => {
    const files = [
      { path: './src/file.ts', content: 'content1' },
      { path: 'src//double//slash.ts', content: 'content2' },
    ]

    const result = sanitizeGeneratedFiles(files)

    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('src/file.ts')
    expect(result[1].path).toBe('src/double/slash.ts')
  })

  it('should return empty array for all invalid files', () => {
    const files = [
      { path: '../bad1.ts', content: 'bad' },
      { path: '/etc/bad2.ts', content: 'bad' },
      { path: '..', content: 'bad' },
    ]

    const result = sanitizeGeneratedFiles(files)

    expect(result).toHaveLength(0)
  })

  it('should handle empty input array', () => {
    const result = sanitizeGeneratedFiles([])
    expect(result).toHaveLength(0)
  })
})
