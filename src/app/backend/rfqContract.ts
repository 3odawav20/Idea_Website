export interface ExplicitVariant {
  id: string;
}

export function resolveExplicitVariant<T extends ExplicitVariant>(
  variants: readonly T[],
  selectedId: string | undefined
): T | null {
  if (!selectedId) return null;
  return variants.find((variant) => variant.id === selectedId) ?? null;
}
