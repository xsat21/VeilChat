type TrustedTypesWindow = Window & {
  trustedTypes?: {
    createPolicy(name: string, rules: {
      createHTML?: (input: string) => string;
      createScriptURL?: (input: string) => string;
    }): unknown;
  };
};

/**
 * Detects Trusted Types support without creating a permissive policy.
 *
 * VeilChat intentionally does not expose an application policy yet. If a future
 * dependency requires one, its allowed sinks and transformations must be
 * reviewed in a dedicated security change.
 */
export function supportsTrustedTypes(): boolean {
  return typeof (window as TrustedTypesWindow).trustedTypes?.createPolicy === 'function';
}
