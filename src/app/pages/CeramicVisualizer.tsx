import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useStore } from "../store/store";
import { supabase } from "../backend/supabaseClient";
import { useBackend } from "../backend/db";
import CeramicStudio from "../ceramic-studio/CeramicStudio.jsx";
import "../ceramic-studio/studio.css";

export function CeramicVisualizer() {
  const { products, addToQuote } = useStore();
  const { session } = useBackend();
  const restricted = Boolean(session && session.role !== "customer");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedProduct = params.get("product");
  const options = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (p.collection === "ceramics" || p.collection === "porcelain") &&
            p.image,
        )
        .map((p) => ({
          id: p.id,
          name: p.name.ar || p.name.en,
          kind: /marble/i.test(p.texture || p.source?.originalSurface || "")
            ? "رخامي"
            : /stone/i.test(p.texture || "")
              ? "حجر طبيعي"
              : /matte|matt/i.test(p.finish || p.source?.originalSurface || "")
                ? "مطفي"
                : "كتالوج IDEA",
          category:
            p.type?.toLowerCase() === "marble"
              ? "رخام"
              : p.collection === "porcelain"
                ? "بورسلين"
                : "سيراميك",
          tileSize:
            p.sizes?.[0]?.widthMm && p.sizes?.[0]?.heightMm
              ? `${p.sizes[0].widthMm / 10} × ${p.sizes[0].heightMm / 10}`
              : undefined,
          tone: p.brand,
          // Prefer the actual tile swatch over a staged room photograph.
          src: p.source?.original?.tiles?.[0] || p.image,
          product: true,
        })),
    [products],
  );

  async function authenticate() {
    if (!supabase)
      throw new Error("خدمة الحسابات غير مُعدّة. راجع إعدادات الموقع.");
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session)
      throw new Error(
        "سجّل الدخول من حساب IDEA أولًا لتفعيل التوليد الذكي. المعاينة المحلية متاحة بدون حساب.",
      );
    const uid = data.session.user.id;
    const [roleResult, membershipResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", uid)
        .limit(1),
    ]);
    if (roleResult.error || membershipResult.error)
      throw new Error("تعذّر التحقق من صلاحية الحساب. حاول لاحقًا.");
    if (
      roleResult.data?.role !== "buyer" ||
      !Array.isArray(membershipResult.data) ||
      membershipResult.data.length
    )
      throw new Error(
        "توليد الصور مخصص للعملاء المشترين فقط، وغير متاح لحسابات الشركات أو الأدمين.",
      );
    return data.session.access_token;
  }

  return (
    <CeramicStudio
      key={requestedProduct || "studio"}
      materialOptions={options}
      initialMaterialId={requestedProduct}
      authenticate={authenticate}
      generationDisabled={restricted}
      onRequestQuote={(id: string) => {
        addToQuote(id, "sqm");
        navigate("/request-quote/new");
      }}
    />
  );
}
