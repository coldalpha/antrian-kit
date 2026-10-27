import type { AudioSequenceItem } from '@antrian-kit/contracts';

/**
 * Maps integer (1 - 999) to sequence of Indonesian audio tokens
 */
export function buildIndonesianNumberTokens(num: number): AudioSequenceItem[] {
  if (num < 1 || num > 999) {
    throw new RangeError(`Nomor antrean di luar jangkauan yang didukung (1 - 999): ${num}`);
  }

  // 1 to 11 have dedicated files
  if (num <= 11) {
    return [
      {
        token: `num:${num}`,
        path: `numbers/${num}.mp3`,
      },
    ];
  }

  // 12 to 19: [angka_satuan] + "belas"
  if (num >= 12 && num <= 19) {
    const satuan = num - 10;
    return [
      {
        token: `num:${satuan}`,
        path: `numbers/${satuan}.mp3`,
      },
      {
        token: 'num:belas',
        path: 'numbers/belas.mp3',
      },
    ];
  }

  // 20 to 99: [puluhan] + "puluh" (+ [satuan])
  if (num <= 99) {
    const puluhan = Math.floor(num / 10);
    const sisa = num % 10;

    const tokens: AudioSequenceItem[] = [
      {
        token: `num:${puluhan}`,
        path: `numbers/${puluhan}.mp3`,
      },
      {
        token: 'num:puluh',
        path: 'numbers/puluh.mp3',
      },
    ];

    if (sisa > 0) {
      tokens.push({
        token: `num:${sisa}`,
        path: `numbers/${sisa}.mp3`,
      });
    }

    return tokens;
  }

  // 100 to 199: "seratus" (+ [sisa 1 - 99])
  if (num >= 100 && num <= 199) {
    const tokens: AudioSequenceItem[] = [
      {
        token: 'num:seratus',
        path: 'numbers/seratus.mp3',
      },
    ];
    const sisa = num - 100;
    if (sisa > 0) {
      tokens.push(...buildIndonesianNumberTokens(sisa));
    }
    return tokens;
  }

  // 200 to 999: [ratusan] + "ratus" (+ [sisa 1 - 99])
  const ratusan = Math.floor(num / 100);
  const sisa = num % 100;
  const tokens: AudioSequenceItem[] = [
    {
      token: `num:${ratusan}`,
      path: `numbers/${ratusan}.mp3`,
    },
    {
      token: 'num:ratus',
      path: 'numbers/ratus.mp3',
    },
  ];

  if (sisa > 0) {
    tokens.push(...buildIndonesianNumberTokens(sisa));
  }

  return tokens;
}
