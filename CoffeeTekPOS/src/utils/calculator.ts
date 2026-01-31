// src/utils/calculator.ts

export const getSmartSuggestions = (amount: number): number[] => {
  const suggestions = new Set<number>();
  
  // Luôn gợi ý chính số tiền đó (Khách đưa đủ)
  suggestions.add(amount);

  // Các mệnh giá VNĐ phổ biến
  const denominations = [10000, 20000, 50000, 100000, 200000, 500000];

  denominations.forEach(d => {
    if (d >= amount) {
      suggestions.add(d); // Gợi ý tờ chẵn lớn hơn (VD: 32k -> gợi ý 50k)
    }
  });

  // Gợi ý làm tròn chục/trăm
  // VD: 135k -> Gợi ý 140k, 150k
  if (amount > 0) {
      const round10k = Math.ceil(amount / 10000) * 10000;
      const round50k = Math.ceil(amount / 50000) * 50000;
      const round100k = Math.ceil(amount / 100000) * 100000;
      
      if (round10k > amount) suggestions.add(round10k);
      if (round50k > amount) suggestions.add(round50k);
      if (round100k > amount) suggestions.add(round100k);
  }

  // Sắp xếp tăng dần và lấy tối đa 4-5 gợi ý để không rối UI
  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 6);
};