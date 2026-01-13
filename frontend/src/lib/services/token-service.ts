/**
 * TokenService - Centralized token management
 *
 * Single source of truth for all token operations.
 * Handles localStorage access with SSR safety.
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

class TokenServiceClass {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  getAccessToken(): string | null {
    if (!this.isClient()) return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    if (!this.isClient()) return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // ---------------------------------------------------------------------------
  // Setters
  // ---------------------------------------------------------------------------

  setAccessToken(token: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  setRefreshToken(token: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  clearAccessToken(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  clearRefreshToken(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  clearTokens(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  /**
   * Get authorization header value
   * @returns "Bearer {token}" or null if no token
   */
  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }
}

// Export singleton instance
export const TokenService = new TokenServiceClass();
