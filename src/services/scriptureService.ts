// Local data only — no external API required
import { SCRIPTURE_DATA, VERSE_COUNTS } from '../data/scriptureData';

export interface ScriptureVerse {
  scriptureId: string;
  section: string;
  verse: string;
  sanskrit: string;
  english: string;
  transliteration?: string;
}

export const SCRIPTURES = [
  { id: 'bhagavad_gita',           name: 'Bhagavad Gita',           sections: 18, sectionLabel: 'Chapter' },
  { id: 'rigveda',                  name: 'Rigveda',                  sections: 10, sectionLabel: 'Mandala' },
  { id: 'samaveda',                 name: 'Samaveda',                 sections: 2,  sectionLabel: 'Part' },
  { id: 'yajurveda',                name: 'Yajurveda',                sections: 40, sectionLabel: 'Chapter' },
  { id: 'atharvaveda',              name: 'Atharvaveda',              sections: 20, sectionLabel: 'Kanda' },
  { id: 'isha_upanishad',           name: 'Isha Upanishad',           sections: 1,  sectionLabel: 'Section' },
  { id: 'kena_upanishad',           name: 'Kena Upanishad',           sections: 4,  sectionLabel: 'Khanda' },
  { id: 'katha_upanishad',          name: 'Katha Upanishad',          sections: 6,  sectionLabel: 'Valli' },
  { id: 'mundaka_upanishad',        name: 'Mundaka Upanishad',        sections: 6,  sectionLabel: 'Mundaka' },
  { id: 'mandukya_upanishad',       name: 'Mandukya Upanishad',       sections: 1,  sectionLabel: 'Section' },
  { id: 'taittiriya_upanishad',     name: 'Taittiriya Upanishad',     sections: 3,  sectionLabel: 'Valli' },
  { id: 'aitareya_upanishad',       name: 'Aitareya Upanishad',       sections: 3,  sectionLabel: 'Adhyaya' },
  { id: 'chandogya_upanishad',      name: 'Chandogya Upanishad',      sections: 8,  sectionLabel: 'Prapathaka' },
  { id: 'brihadaranyaka_upanishad', name: 'Brihadaranyaka Upanishad', sections: 6,  sectionLabel: 'Adhyaya' },
];

export const fetchVerseCount = async (scriptureId: string, section: string): Promise<number> => {
  const counts = VERSE_COUNTS[scriptureId];
  if (counts && counts[section] !== undefined) return counts[section];
  return 10;
};

export const fetchScriptureVerse = async (
  scriptureId: string, section: string, verse: string
): Promise<ScriptureVerse> => {
  const verseData = SCRIPTURE_DATA[scriptureId]?.[section]?.[verse];
  if (verseData) {
    return { scriptureId, section, verse, sanskrit: verseData.sanskrit, english: verseData.english, transliteration: verseData.transliteration };
  }
  const sectionDb = SCRIPTURE_DATA[scriptureId]?.[section];
  const scripture = SCRIPTURES.find(s => s.id === scriptureId);
  const name = scripture?.name ?? scriptureId;
  const label = scripture?.sectionLabel ?? 'Section';
  if (sectionDb) {
    const available = Object.keys(sectionDb).map(Number).sort((a, b) => a - b);
    const verseNum = parseInt(verse, 10);
    const closest = available.reduce((p, c) => Math.abs(c - verseNum) < Math.abs(p - verseNum) ? c : p);
    const cd = sectionDb[closest.toString()];
    return { scriptureId, section, verse, sanskrit: cd.sanskrit, english: `[Nearest stored verse — ${label} ${section}:${closest}]\n\n${cd.english}`, transliteration: cd.transliteration };
  }
  return { scriptureId, section, verse, sanskrit: '॥ ॐ ॥', transliteration: 'oṁ', english: `${name} — ${label} ${section}, Verse ${verse} is not yet in the local database. Navigate to a nearby verse to read stored content.` };
};
