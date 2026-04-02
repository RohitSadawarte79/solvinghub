import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, setToken, removeToken, getUserFromToken } from '../api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock document.cookie
const cookieMock = vi.fn();
Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should get token from localStorage', () => {
      const mockToken = 'test-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      const result = getToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(result).toBe(mockToken);
    });

    it('should get token from cookie when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      cookieMock.mockReturnValue('auth_token=cookie-token; other=value');

      const result = getToken();

      expect(result).toBe('cookie-token');
    });

    it('should return null when no token found', () => {
      localStorageMock.getItem.mockReturnValue(null);
      cookieMock.mockReturnValue('');

      const result = getToken();

      expect(result).toBeNull();
    });

    it('should set token in localStorage', () => {
      const mockToken = 'test-token';
      setToken(mockToken);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    });

    it('should remove token from localStorage and clear cookie', () => {
      removeToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(cookieMock).toHaveBeenCalledWith('auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;');
    });
  });

  describe('User Profile from Token', () => {
    it('should parse valid token and return user profile', () => {
      const mockToken = 'header.' + btoa(JSON.stringify({
        uid: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        rank: 'A',
        points: 1500,
        exp: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
      })) + '.signature';

      localStorageMock.getItem.mockReturnValue(mockToken);

      const result = getUserFromToken();

      expect(result).toEqual({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg',
        rank: 'A',
        points: 1500,
      });
    });

    it('should return null for expired token', () => {
      const expiredToken = 'header.' + btoa(JSON.stringify({
        uid: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      })) + '.signature';

      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = getUserFromToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should return null for invalid token format', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      const result = getUserFromToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle base64url encoding correctly', () => {
      // Test with base64url encoded characters
      const payload = {
        uid: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      
      // Create proper base64url encoding
      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const mockToken = 'header.' + base64Payload + '.signature';
      localStorageMock.getItem.mockReturnValue(mockToken);

      const result = getUserFromToken();

      expect(result).toEqual({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
        rank: 'F',
        points: 0,
      });
    });
  });
});
