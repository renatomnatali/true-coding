import { describe, it, expect, vi, beforeEach } from 'vitest'
import { encrypt, decrypt, isEncrypted } from './crypto'

describe('Crypto Utils', () => {
  beforeEach(() => {
    // Set up a valid 32-byte key (base64 encoded)
    const key = Buffer.alloc(32).fill('a').toString('base64')
    vi.stubEnv('ENCRYPTION_KEY', key)
  })

  describe('encrypt', () => {
    it('should encrypt text and return formatted string', () => {
      const plaintext = 'gho_test_token_12345'
      const encrypted = encrypt(plaintext)

      // Should be in format iv:authTag:encryptedData
      const parts = encrypted.split(':')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toHaveLength(32) // IV is 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32) // Auth tag is 16 bytes = 32 hex chars
      expect(parts[2].length).toBeGreaterThan(0) // Encrypted data
    })

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'test_token'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      // Due to random IV, same plaintext should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should throw when ENCRYPTION_KEY is not set', () => {
      vi.stubEnv('ENCRYPTION_KEY', '')

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is required')
    })
  })

  describe('decrypt', () => {
    it('should decrypt encrypted text correctly', () => {
      const plaintext = 'gho_secret_token_xyz'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should handle special characters', () => {
      const plaintext = 'token!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', () => {
      const plaintext = 'token-with-unicode-\u{1F600}-emoji'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should throw on invalid format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted text format')
      expect(() => decrypt('only:two')).toThrow('Invalid encrypted text format')
      expect(() => decrypt('too:many:parts:here')).toThrow('Invalid encrypted text format')
    })

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'test_token'
      const encrypted = encrypt(plaintext)
      const parts = encrypted.split(':')

      // Tamper with the encrypted data
      parts[2] = 'ff' + parts[2].slice(2)
      const tampered = parts.join(':')

      expect(() => decrypt(tampered)).toThrow()
    })
  })

  describe('isEncrypted', () => {
    it('should return true for encrypted text', () => {
      const encrypted = encrypt('test_token')
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('should return false for plain text', () => {
      expect(isEncrypted('gho_plain_token')).toBe(false)
      expect(isEncrypted('not:encrypted')).toBe(false)
      expect(isEncrypted('short:iv:data')).toBe(false)
    })

    it('should validate IV and auth tag lengths', () => {
      // IV should be 32 hex chars (16 bytes)
      // Auth tag should be 32 hex chars (16 bytes)
      const validFormat = 'a'.repeat(32) + ':' + 'b'.repeat(32) + ':' + 'encrypted'
      expect(isEncrypted(validFormat)).toBe(true)

      const shortIV = 'a'.repeat(30) + ':' + 'b'.repeat(32) + ':' + 'encrypted'
      expect(isEncrypted(shortIV)).toBe(false)

      const shortAuthTag = 'a'.repeat(32) + ':' + 'b'.repeat(30) + ':' + 'encrypted'
      expect(isEncrypted(shortAuthTag)).toBe(false)
    })
  })

  describe('roundtrip', () => {
    it('should handle long tokens', () => {
      const longToken = 'gho_' + 'x'.repeat(1000)
      const encrypted = encrypt(longToken)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(longToken)
    })

    it('should handle empty string', () => {
      const encrypted = encrypt('')
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe('')
    })
  })
})
