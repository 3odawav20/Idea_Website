import type { Product } from "./types";

const text = (value?: string | null) => Boolean(value?.trim());

export function hasPublicProductContent(product: Product) {
  const hasName = text(product.name?.en) || text(product.name?.ar) || text(product.name?.fr);
  const hasImage = text(product.image);
  const hasStructuredDetails = [
    product.brand, product.description, product.model, product.code, product.origin,
    product.type, product.material, product.surface, product.texture, product.pattern,
    product.finish, product.application, product.subcategory, product.series,
    product.family, product.packaging, product.weight, product.availability,
  ].some(text)
    || product.sizes.length > 0
    || (product.colors?.length ?? 0) > 0
    || (product.usage?.length ?? 0) > 0
    || (product.variants?.length ?? 0) > 0
    || (product.specificationGroups?.some((group) => group.items.length > 0) ?? false)
    || text(product.source?.provider)
    || text(product.source?.productPageUrl);

  return product.approved && hasName && hasImage && hasStructuredDetails;
}
