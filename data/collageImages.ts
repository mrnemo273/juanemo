export interface CollageImage {
  id: string;
  url: string;
  thumbUrl: string;
  category: CollageCategory;
  tags: string[];
  dominantColor: string;
  aspectRatio: number;
}

export type CollageCategory =
  | 'nature'
  | 'architecture'
  | 'people'
  | 'abstract'
  | 'texture'
  | 'urban'
  | 'landscape'
  | 'still-life';

const img = (
  photoId: string,
  category: CollageCategory,
  tags: string[],
  dominantColor: string,
  aspectRatio: number = 1.5
): CollageImage => ({
  id: photoId,
  url: `https://images.unsplash.com/photo-${photoId}?w=1200&fit=crop&auto=format&q=80`,
  thumbUrl: `https://images.unsplash.com/photo-${photoId}?w=300&h=200&fit=crop&auto=format&q=60`,
  category,
  tags,
  dominantColor,
  aspectRatio,
});

export const COLLAGE_IMAGES: CollageImage[] = [
  // ── Nature (10) ──────────────────────────────────────────────────────
  img('1469474968028-56623f02e42e', 'nature', ['forest', 'trees', 'sunlight'], '#2d5016', 1.5),
  img('1441974231531-c6227db76b6e', 'nature', ['forest', 'green', 'path'], '#1a3d0c', 1.5),
  img('1518837695005-2083093ee35b', 'nature', ['ocean', 'aerial', 'blue'], '#1a6b8a', 1.5),
  img('1517694712202-14dd9538aa97', 'nature', ['ocean', 'waves', 'power'], '#2c5f7c', 1.5),
  img('1490750967868-88aa4f44baee', 'nature', ['flower', 'pink', 'bloom'], '#d4567a', 1.33),
  img('1462275646964-a0e3c11f18a6', 'nature', ['cherry blossom', 'spring'], '#e8a4b8', 1.5),
  img('1474511320723-9a56873571b2', 'nature', ['bird', 'flight', 'sky'], '#87a5c2', 1.5),
  img('1504006833117-8886a355efbf', 'nature', ['deer', 'wildlife', 'meadow'], '#8b9a6b', 1.5),
  img('1433086966358-54859d0ed716', 'nature', ['waterfall', 'moss', 'green'], '#3a6b3a', 1.5),
  img('1542202229-7d93c33f5d07', 'nature', ['autumn', 'leaves', 'orange'], '#c4651a', 1.5),

  // ── Architecture (10) ────────────────────────────────────────────────
  img('1486312338219-ce68d2c6f44d', 'architecture', ['red wall', 'minimal'], '#c23616', 1.5),
  img('1431576901776-e539bd916ba2', 'architecture', ['building', 'glass', 'modern'], '#6b8fa3', 1.5),
  img('1479839672679-a46483c0e7c8', 'architecture', ['stairs', 'spiral', 'white'], '#e8e8e8', 1.33),
  img('1487958449943-2429e8be8625', 'architecture', ['bridge', 'fog', 'golden gate'], '#c44520', 1.5),
  img('1518005068251-37900150dfca', 'architecture', ['cathedral', 'ceiling', 'ornate'], '#d4a84b', 1.33),
  img('1545558014-8692077e9b5c', 'architecture', ['museum', 'interior', 'white'], '#f0ece2', 1.5),
  img('1464817739973-0128fe77aed1', 'architecture', ['concrete', 'brutalist', 'grey'], '#8c8c8c', 1.5),
  img('1511818966892-d7d671e672a2', 'architecture', ['dome', 'blue', 'mosque'], '#1565a0', 1.33),
  img('1534430480872-3498386e7856', 'architecture', ['window', 'light', 'shadow'], '#d9c9a5', 1.5),
  img('1523413651479-597eb2da0ad6', 'architecture', ['skyscraper', 'lookup', 'glass'], '#4a6d8c', 1.5),

  // ── People (7) ───────────────────────────────────────────────────────
  img('1504609773096-104ff2c73ba4', 'people', ['silhouette', 'sunset', 'standing'], '#e8751a', 1.5),
  img('1529156069898-49953e39b3ac', 'people', ['crowd', 'concert', 'lights'], '#2a1a4a', 1.5),
  img('1485827404703-89b55fcc595e', 'people', ['running', 'motion', 'street'], '#8c7a6b', 1.5),
  img('1517457373958-b7bdd4587205', 'people', ['umbrella', 'rain', 'walking'], '#3a4a5a', 1.5),
  img('1496275068113-fff8c90750d1', 'people', ['woman', 'back', 'hat', 'field'], '#c9b896', 1.5),
  img('1459749411175-04bf5292ceea', 'people', ['cyclist', 'road', 'distance'], '#7a8a6a', 1.5),
  img('1519671282429-b44e0c04c0e4', 'people', ['hands', 'reaching', 'light'], '#f0dcc8', 1.33),

  // ── Abstract (9) ─────────────────────────────────────────────────────
  img('1507003211169-0a1dd7228f2d', 'abstract', ['gradient', 'pink', 'blue'], '#a855c4', 1.5),
  img('1550684376-efcbd6e3f031', 'abstract', ['smoke', 'colorful', 'flowing'], '#6b2fa0', 1.5),
  img('1541701494587-cb58502866ab', 'abstract', ['ink', 'water', 'swirl'], '#1a3d6b', 1.5),
  img('1558591710-4b4a1ae0f04d', 'abstract', ['light', 'prism', 'rainbow'], '#e84393', 1.5),
  img('1516557070061-c3d1653fa646', 'abstract', ['bubbles', 'macro', 'color'], '#4a90d9', 1.33),
  img('1553356084-58ef4a67b2a7', 'abstract', ['paint', 'fluid', 'marble'], '#d4a574', 1.5),
  img('1557672172-298e090bd0f1', 'abstract', ['neon', 'lines', 'geometry'], '#ff6b6b', 1.5),
  img('1549490349-8643362247b5', 'abstract', ['holographic', 'foil', 'sheen'], '#c8a2e8', 1.5),
  img('1515462277126-2dd0c162007a', 'abstract', ['fractal', 'pattern', 'spiral'], '#2d6a4f', 1.5),

  // ── Texture (9) ──────────────────────────────────────────────────────
  img('1493246507139-91e8fad9978e', 'texture', ['wood', 'grain', 'brown'], '#8b6914', 1.5),
  img('1558618666-fcd25c85f82e', 'texture', ['marble', 'white', 'veins'], '#e8e0d8', 1.5),
  img('1504714146340-959ca07e1f38', 'texture', ['concrete', 'grey', 'rough'], '#9a9a9a', 1.5),
  img('1489599849927-2ee91cede3ba', 'texture', ['brick', 'red', 'wall'], '#8b3a2a', 1.5),
  img('1530281700549-e82e7bf110d6', 'texture', ['fabric', 'silk', 'waves'], '#d4c5b2', 1.5),
  img('1533628635777-112b2239b1c7', 'texture', ['metal', 'brushed', 'silver'], '#b0b0b0', 1.5),
  img('1531685250784-e48199d2e24c', 'texture', ['paper', 'crumpled', 'white'], '#f5f0e8', 1.5),
  img('1485160497022-3e09382fb310', 'texture', ['sand', 'dunes', 'ripples'], '#d4a04a', 1.5),
  img('1477346611705-65d1883cee1e', 'texture', ['ice', 'frost', 'crystal'], '#c8e0f0', 1.33),

  // ── Urban (9) ────────────────────────────────────────────────────────
  img('1519501025264-65ba15a82390', 'urban', ['neon', 'tokyo', 'night'], '#ff2d78', 1.5),
  img('1480714378408-67cf0d13bc1b', 'urban', ['city', 'night', 'lights'], '#1a2a4a', 1.5),
  img('1494522855154-9297ac14b55f', 'urban', ['taxi', 'yellow', 'street'], '#e8c41a', 1.5),
  img('1517299321609-52687d1bc55a', 'urban', ['subway', 'motion', 'blur'], '#4a5a6a', 1.5),
  img('1513635269975-59663e0ac1ad', 'urban', ['skyscrapers', 'manhattan', 'dusk'], '#2a4a6a', 1.5),
  img('1542362567-b07e54358753', 'urban', ['graffiti', 'wall', 'colorful'], '#e84420', 1.5),
  img('1508739773434-c26b3d09e071', 'urban', ['street', 'rain', 'reflections'], '#3a5a7a', 1.5),
  img('1514924013411-cbf25faa35bb', 'urban', ['sign', 'vintage', 'motel'], '#c44a2a', 1.5),
  img('1506781961370-37a89d6b3095', 'urban', ['crosswalk', 'aerial', 'people'], '#4a4a4a', 1.5),

  // ── Landscape (9) ────────────────────────────────────────────────────
  img('1506744038136-46273834b3fb', 'landscape', ['mountains', 'lake', 'reflection'], '#2d4a6b', 1.5),
  img('1519681393784-d120267933ba', 'landscape', ['stars', 'night sky', 'milky way'], '#0a0a2e', 1.5),
  img('1507525428034-b723cf961d3e', 'landscape', ['beach', 'tropical', 'palm'], '#2da5c4', 1.5),
  img('1472214103451-9374bd1c798e', 'landscape', ['field', 'golden', 'sunset'], '#d4961a', 1.5),
  img('1509316785289-025f5b846b35', 'landscape', ['desert', 'sand', 'dunes'], '#d4a050', 1.5),
  img('1470071459604-3b5ec3a7fe05', 'landscape', ['valley', 'green', 'fog'], '#4a7a4a', 1.5),
  img('1464822759023-fed622ff2c3b', 'landscape', ['volcano', 'lava', 'glow'], '#c44a1a', 1.5),
  img('1500534314209-a25ddb2bd429', 'landscape', ['lavender', 'field', 'purple'], '#7a4aa0', 1.5),
  img('1501785888041-af3ef285b470', 'landscape', ['northern lights', 'aurora', 'sky'], '#1a8a4a', 1.5),

  // ── Still Life (7) ───────────────────────────────────────────────────
  img('1495474472287-4d71bcdd2085', 'still-life', ['coffee', 'cup', 'warm'], '#6b3a1a', 1.5),
  img('1490818387583-1baba5e638af', 'still-life', ['fruit', 'colorful', 'bowl'], '#e84a2a', 1.33),
  img('1487530811176-3780de880c2d', 'still-life', ['flowers', 'vase', 'pink'], '#d47a8a', 1.33),
  img('1504674900247-0877df9cc836', 'still-life', ['books', 'stacked', 'vintage'], '#8b7a5a', 1.5),
  img('1506368249639-73a05d6f6488', 'still-life', ['camera', 'vintage', 'leather'], '#5a4a3a', 1.5),
  img('1482049016688-2d3e1b311543', 'still-life', ['food', 'plating', 'elegant'], '#2a4a2a', 1.5),
  img('1513558161293-7d334e1b5d93', 'still-life', ['perfume', 'bottle', 'minimal'], '#e8d8c8', 1.33),
];

export function getImagesByCategory(category: CollageCategory): CollageImage[] {
  return COLLAGE_IMAGES.filter(img => img.category === category);
}

export function getCategories(): CollageCategory[] {
  return [...new Set(COLLAGE_IMAGES.map(img => img.category))];
}
