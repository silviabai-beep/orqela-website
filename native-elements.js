const purple = '#6d36ff';
const violet = '#8f68ff';
const navy = '#13284d';
const blue = '#2467e8';
const cyan = '#13b7c8';
const green = '#13a77f';
const gold = '#d8972f';
const coral = '#df5b6f';

function shape(page, order, text, textEn, x, y, w, h, fill, options = {}) {
  return {
    id: `native-${page}-${order}`,
    type: 'shape',
    text,
    textEn,
    x,
    y,
    w,
    h,
    fontSize: options.fontSize || 24,
    color: options.color || '#ffffff',
    background: fill,
    borderColor: options.borderColor || fill,
    borderWidth: options.borderWidth ?? 0,
    radius: options.radius ?? 18,
    opacity: options.opacity ?? 1,
    rotation: options.rotation || 0,
    bold: options.bold ?? true,
    align: options.align || 'center'
  };
}

function cards(page, labels, colors = [purple, blue, green, gold], y = 37, height = 18) {
  const columns = labels.length <= 3 ? 3 : 2;
  const width = columns === 3 ? 12 : 17;
  const gap = columns === 3 ? 2.2 : 2.4;
  return labels.map((label, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return shape(page, index + 1, label[0], label[1], 56 + column * (width + gap), y + row * (height + 4), width, height, colors[index % colors.length]);
  });
}

export function seedNativeElements(index) {
  const page = index + 1;
  switch (page) {
    case 1:
      return [
        shape(page, 1, '需求智能', 'Demand Intelligence', 59, 34, 27, 14, purple),
        shape(page, 2, '合规供应', 'Compliant Supply', 63, 52, 27, 14, blue),
        shape(page, 3, '本地履约', 'Local Fulfilment', 57, 70, 27, 14, green),
        shape(page, 4, '', '', 84, 25, 10, 10, violet, { radius: 999, opacity: .5 }),
        shape(page, 5, '', '', 88, 62, 6, 6, cyan, { radius: 999, opacity: .7 })
      ];
    case 2:
      return cards(page, [['01\n终端数据', '01\nMarket Data'], ['02\nAI 决策', '02\nAI Decisions'], ['03\n合规供应', '03\nCompliant Supply'], ['04\n收入闭环', '04\nRevenue Loop']], [purple, blue, green, gold], 34, 21);
    case 3:
      return cards(page, [['需求碎片化', 'Fragmented Demand'], ['监管趋严', 'Tighter Regulation'], ['产品迭代加速', 'Faster Product Cycles']], [purple, coral, blue], 35, 38).map((item, i) => ({ ...item, radius: 28, rotation: i === 0 ? -2 : i === 2 ? 2 : 0 }));
    case 4:
      return [
        shape(page, 1, 'VAPE', 'VAPE', 56, 37, 17, 17, purple, { radius: 999, fontSize: 28 }),
        shape(page, 2, '新型烟草', 'NEXT-GEN\nTOBACCO', 74, 32, 18, 18, blue, { radius: 999, fontSize: 20 }),
        shape(page, 3, 'CBD', 'CBD', 67, 57, 19, 19, green, { radius: 999, fontSize: 28 }),
        shape(page, 4, '统一数据逻辑', 'ONE DATA LOGIC', 59, 78, 31, 8, navy, { radius: 999, fontSize: 16 })
      ];
    case 5:
      return cards(page, [['零售商\n卖什么？', 'Retailer\nWhat to sell?'], ['分销商\n买多少？', 'Distributor\nHow much to buy?'], ['供应商\n生产什么？', 'Supplier\nWhat to make?'], ['平台\n如何控风险？', 'Platform\nHow to manage risk?']], [purple, blue, green, coral], 33, 22);
    case 6:
      return cards(page, [['SELL\n优先销售', 'SELL\nPrioritize'], ['BUY\n智能采购', 'BUY\nPurchase'], ['BUILD\n定义新品', 'BUILD\nCreate']], [purple, blue, green], 35, 42).map(item => ({ ...item, fontSize: 28, radius: 24 }));
    case 7:
      return [
        shape(page, 1, 'ORQELA\n需求智能', 'ORQELA\nDemand Intelligence', 55, 38, 16, 18, purple),
        shape(page, 2, '→', '→', 71, 43, 6, 8, 'transparent', { color: '#8f68ff', fontSize: 42 }),
        shape(page, 3, '合规\n零部件供应商', 'Compliant\nComponent Suppliers', 77, 34, 17, 18, blue),
        shape(page, 4, '本地持牌\n组装伙伴', 'Licensed Local\nAssembly Partners', 77, 61, 17, 18, green),
        shape(page, 5, '↘', '↘', 69, 61, 7, 9, 'transparent', { color: '#13a77f', fontSize: 40 })
      ];
    case 8:
      return [
        shape(page, 1, '不承担', 'AVOID', 54, 31, 20, 10, coral, { radius: 999, fontSize: 28 }),
        shape(page, 2, '大库存\n长期垫资\n重资产生产', 'Large Inventory\nWorking Capital\nHeavy Production', 53, 43, 22, 37, '#351326', { borderColor: '#ff6f86', borderWidth: 3, fontSize: 32 }),
        shape(page, 3, '承担', 'OWN', 77, 31, 19, 10, green, { radius: 999, fontSize: 28 }),
        shape(page, 4, '数据产品\n决策质量\n合规与协同', 'Data Product\nDecision Quality\nCompliance & Coordination', 76, 43, 21, 37, '#0b3531', { borderColor: '#20d5a8', borderWidth: 3, fontSize: 32 })
      ];
    case 9:
      return [
        shape(page, 1, '产品智能', 'Product\nIntelligence', 67, 29, 16, 16, purple, { radius: 999, fontSize: 18 }),
        shape(page, 2, 'SELL / BUY\n/ BUILD', 'SELL / BUY\n/ BUILD', 81, 43, 16, 16, blue, { radius: 999, fontSize: 18 }),
        shape(page, 3, '市场反馈', 'Market\nFeedback', 72, 65, 16, 16, green, { radius: 999, fontSize: 18 }),
        shape(page, 4, '结果学习', 'Outcome\nLearning', 53, 61, 16, 16, gold, { radius: 999, fontSize: 18 }),
        shape(page, 5, '业务发现', 'Business\nDiscovery', 51, 39, 16, 16, coral, { radius: 999, fontSize: 18 }),
        shape(page, 6, '↻', '↻', 67, 45, 14, 14, 'transparent', { color: '#a994ff', fontSize: 58 })
      ];
    case 10:
      return [
        shape(page, 1, '前端收入', 'FRONT-END', 54, 33, 20, 10, purple, { radius: 999, fontSize: 28 }),
        shape(page, 2, 'SaaS 订阅\nUsage\n数据与合规模块', 'SaaS Subscription\nUsage\nData & Compliance', 53, 45, 22, 37, '#211650', { borderColor: '#9b7aff', borderWidth: 3, fontSize: 32 }),
        shape(page, 3, '后端收入', 'BACK-END', 77, 33, 19, 10, green, { radius: 999, fontSize: 28 }),
        shape(page, 4, '采购协同\n供应商服务\n交易佣金', 'Procurement\nSupplier Services\nTransaction Fees', 76, 45, 21, 37, '#0b3531', { borderColor: '#20d5a8', borderWidth: 3, fontSize: 32 })
      ];
    case 11:
      return cards(page, [['阶段 1\n验证产品', 'PHASE 1\nValidate'], ['阶段 2\n扩大网络', 'PHASE 2\nScale Network'], ['阶段 3\n复制市场', 'PHASE 3\nReplicate']], [purple, blue, green], 37, 35).map((item, i) => ({ ...item, y: item.y + i * 4, h: 28 }));
    case 12:
      return [
        shape(page, 1, '', '', 56, 55, 38, 1.2, violet, { radius: 999 }),
        ...[['MVP', 'MVP'], ['BUILD', 'BUILD'], ['美国闭环', 'U.S. LOOP'], ['多市场复制', 'MULTI-MARKET']].map((label, i) => shape(page, i + 2, label[0], label[1], 54 + i * 11, 43 + (i % 2) * 17, 10, 10, [purple, blue, green, gold][i], { radius: 999, fontSize: 14 }))
      ];
    case 13:
      return cards(page, [['US Pack', 'US Pack'], ['EU / UK Pack', 'EU / UK Pack'], ['Indonesia / UAE', 'Indonesia / UAE'], ['LatAm', 'LatAm']], [purple, blue, green, gold], 34, 23)
        .map(item => ({ ...item, fontSize: 30, borderColor: '#ffffff55', borderWidth: 2, radius: 22 }));
    case 14:
      return [
        shape(page, 1, '轻资产', 'ASSET-LIGHT', 55, 31, 19, 12, purple, { radius: 999 }),
        shape(page, 2, '数据网络', 'DATA NETWORK', 76, 31, 19, 12, blue, { radius: 999 }),
        shape(page, 3, '供应链协同', 'SUPPLY NETWORK', 55, 49, 19, 12, green, { radius: 999 }),
        shape(page, 4, '合规优先', 'COMPLIANCE-FIRST', 76, 49, 19, 12, coral, { radius: 999, fontSize: 18 }),
        shape(page, 5, '多市场扩展', 'MULTI-MARKET', 65, 67, 20, 12, gold, { radius: 999 })
      ];
    case 15:
      return [
        shape(page, 1, 'SELL', 'SELL', 55, 54, 12, 13, purple, { radius: 999, fontSize: 34 }),
        shape(page, 2, 'BUY', 'BUY', 69, 54, 12, 13, blue, { radius: 999, fontSize: 34 }),
        shape(page, 3, 'BUILD', 'BUILD', 83, 54, 12, 13, green, { radius: 999, fontSize: 34 }),
        shape(page, 4, 'ORQELA', 'ORQELA', 62, 72, 27, 11, '#0d2348', { borderColor: '#9b7aff', borderWidth: 3, radius: 999, fontSize: 30 })
      ];
    default:
      return [];
  }
}
