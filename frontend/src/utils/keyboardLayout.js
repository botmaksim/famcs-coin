const EN_TO_RU = {
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г',
  'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы',
  'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д',
  ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и',
  'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю', '`': 'ё', '/': '.',
  'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Г',
  'I': 'Ш', 'O': 'Щ', 'P': 'З', '{': 'Х', '}': 'Ъ', 'A': 'Ф', 'S': 'Ы',
  'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л', 'L': 'Д',
  ':': 'Ж', '"': 'Э', 'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И',
  'N': 'Т', 'M': 'Ь', '<': 'Б', '>': 'Ю', '~': 'Ё', '?': ',',
  '@': '"', '#': '№', '$': ';', '^': ':', '&': '?'
};

const RU_TO_EN = Object.entries(EN_TO_RU).reduce((acc, [en, ru]) => {
  acc[ru] = en;
  return acc;
}, {});

export const convertLayout = (text) => {
  if (!text) return '';
  let enCount = 0;
  let ruCount = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) enCount++;
    if (/[а-яА-ЯёЁ]/.test(ch)) ruCount++;
  }

  if (enCount >= ruCount) {
    return text.split('').map(ch => EN_TO_RU[ch] || ch).join('');
  } else {
    return text.split('').map(ch => RU_TO_EN[ch] || ch).join('');
  }
};

export const mapCharToRu = (ch) => {
  return EN_TO_RU[ch] || ch;
};

export const convertTextToRu = (text) => {
  if (!text) return '';
  return text.split('').map(ch => EN_TO_RU[ch] || ch).join('');
};
