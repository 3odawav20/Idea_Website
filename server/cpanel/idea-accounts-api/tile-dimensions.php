<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}

/** Physical dimensions are read from an approved product or manufacturer catalogue, never a browser prompt. */
function ideaTileParseSize(string $label, ?string $sourceUnit = null): array {
    $label = trim(str_replace(["×","✕","Ｘ",'*'], 'x', $label));
    if (!preg_match('/^(\d{1,4}(?:[.,]\d{1,2})?)\s*[xX]\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(cm|mm)?$/iu', $label, $matches)) {
        throw new InvalidArgumentException('TILE_DIMENSIONS_UNRECOGNIZED');
    }
    $unit = strtolower($matches[3] ?: ($sourceUnit ?? ''));
    if ($unit !== 'cm' && $unit !== 'mm') throw new InvalidArgumentException('TILE_DIMENSIONS_UNIT_MISSING');
    $factor = $unit === 'cm' ? 10.0 : 1.0;
    $w = round((float)str_replace(',', '.', $matches[1]) * $factor, 2);
    $h = round((float)str_replace(',', '.', $matches[2]) * $factor, 2);
    if ($w < 50 || $h < 50 || $w > 3200 || $h > 3200) throw new InvalidArgumentException('TILE_DIMENSIONS_OUT_OF_RANGE');
    return [
        'width_mm'=>$w, 'height_mm'=>$h,
        'size_label'=>sprintf('%g × %g cm', $w / 10, $h / 10),
        'aspect_ratio'=>round($w / $h, 6), 'source_unit'=>$unit,
    ];
}

/** Reject a client supplied tile size that disagrees with the authoritative variant. */
function ideaTileAssertMatches(array $size, ?string $label, $widthMm = null, $heightMm = null): void {
    if ($label !== null && trim($label) !== '') {
        $candidate = ideaTileParseSize($label, 'cm');
        if (abs($candidate['width_mm'] - $size['width_mm']) > .1 ||
            abs($candidate['height_mm'] - $size['height_mm']) > .1)
            throw new InvalidArgumentException('PRODUCT_TILE_SIZE_MISMATCH');
    }
    foreach (['width_mm'=>$widthMm, 'height_mm'=>$heightMm] as $key=>$value) {
        if ($value === null || $value === '') continue;
        if (!is_numeric($value) || !is_finite((float)$value) ||
            abs((float)$value - $size[$key]) > .1)
            throw new InvalidArgumentException('PRODUCT_TILE_SIZE_MISMATCH');
    }
}

/** Existing source product IDs or verified supplier listing IDs are acceptable, but never arbitrary typed sizes. */
function ideaTileCataloguedVariant(string $productId): array {
    if ($productId === '' || strlen($productId) > 100) accountError(422, 'PRODUCT_REQUIRED');
    if (preg_match('/^[a-f0-9]{32}$/D', $productId)) {
        $row = accountQuery("SELECT m.width_mm,m.height_mm,m.size_label,m.product_id
            FROM idea_supplier_products p
            JOIN idea_marketplace_product_meta m ON m.product_id=p.id
            JOIN idea_companies c ON c.id=p.company_id
            WHERE p.id=? AND p.active=1 AND m.approved_for_storefront=1 AND c.status='verified'",
            [$productId])->fetch();
        if (!$row) accountError(422, 'PRODUCT_NOT_APPROVED_FOR_VISUALIZATION');
        $w = (float)$row['width_mm']; $h = (float)$row['height_mm'];
        if ($w < 50 || $h < 50 || $w > 3200 || $h > 3200) accountError(422, 'PRODUCT_DIMENSIONS_REQUIRED');
        $size = [
            'width_mm'=>$w, 'height_mm'=>$h,
            'size_label'=>sprintf('%g × %g cm', $w / 10, $h / 10),
            'aspect_ratio'=>round($w / $h, 6), 'source_unit'=>'mm',
            'source_type'=>'approved_supplier',
        ];
        try { ideaTileAssertMatches($size, (string)$row['size_label']); }
        catch (InvalidArgumentException $e) { accountError(422, 'PRODUCT_DIMENSIONS_CONFLICT'); }
        return $size;
    }
    $catalogue = platformProduct($productId);
    $unit = (string)($catalogue['size_unit'] ?? '');
    if ($unit === '' && ($catalogue['brand'] ?? '') === 'Art Ceramic') $unit = 'cm';
    try { $size = ideaTileParseSize((string)($catalogue['size'] ?? ''), $unit); }
    catch (InvalidArgumentException $e) { accountError(422, 'PRODUCT_DIMENSIONS_REQUIRED'); }
    $size['source_type'] = 'manufacturer_catalogue';
    return $size;
}
