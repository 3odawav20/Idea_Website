import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/i18n';

export function isSurfaceProduct(product: { collection?: string; type?: string }) {
  return ['ceramics', 'porcelain'].includes(product.collection || '') || /marble|granite|ceramic|porcelain|tile/i.test(product.type || '');
}

export function TryMaterialLink({ productId, supplierId }: { productId?: string; supplierId?: string }) {
  const { locale } = useI18n();
  const query = supplierId ? `supplier=${encodeURIComponent(supplierId)}` : `product=${encodeURIComponent(productId || '')}`;
  return <Link to={`/ai-room-visualizer?${query}`} className="idea-try-material" style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
    padding: '12px 16px', marginTop: 12, border: '1px solid var(--idea-gold)', borderRadius: 'var(--idea-radius-md)',
    background: 'var(--idea-gold-soft)', color: 'var(--idea-gold-bright)', textDecoration: 'none',
    fontFamily: 'inherit', fontSize: 'var(--idea-text-sm)', fontWeight: 600, minHeight: 44,
  }}><Sparkles size={17} aria-hidden="true" />{locale === 'ar' ? 'جرّبه في مساحتك' : locale === 'fr' ? 'Essayez dans votre pièce' : 'Try it in your space'}</Link>;
}
