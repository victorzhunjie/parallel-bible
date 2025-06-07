import toJyutping from 'https://unpkg.com/to-jyutping@3.1.1?module';

// === DOM REFERENCES ===
const toggle = document.getElementById('darkModeToggle');
const versionA = document.getElementById('versionA');
const versionB = document.getElementById('versionB');
const bookSelect = document.getElementById('bookSelect');
const chapterSelect = document.getElementById('chapterSelect');
const loadBtn = document.getElementById('loadBtn');
const queryWordSpan = document.getElementById('queryWord');
const chapterTitle = document.getElementById('chapterTitle');
const titleA = document.getElementById('titleA');
const titleB = document.getElementById('titleB');
const comparisonContainer = document.getElementById('comparisonContainer');
const togglePinyin = document.getElementById('togglePinyin');
const toggleCantonese = document.getElementById('toggleCantonese');
const toggleTTS = document.getElementById('toggleTTS');
const ttsLangSelect = document.getElementById('ttsLangSelect');
const copyPermalinkBtn = document.getElementById('copyPermalink');

// === TTS LANGUAGE MAP ===
const ttsLangMap = {
  'ar_svd': 'ar-SA',
  'zh_cuv': 'zh-CN',
  'zh_ncv': 'zh-CN',
  'de_schlachter': 'de-DE',
  'el_greek': 'el-GR',
  'en_bbe': 'en-US',
  'en_kjv': 'en-US',
  'eo_esperanto': 'eo',
  'es_rvr': 'es-ES',
  'fi_finnish': 'fi-FI',
  'fi_pr': 'fi-FI',
  'fr_apee': 'fr-FR',
  'ko_ko': 'ko-KR',
  'pt_aa': 'pt-PT',
  'pt_acf': 'pt-PT',
  'pt_nvi': 'pt-PT',
  'ro_cornilescu': 'ro-RO',
  'ru_synodal': 'ru-RU',
  'vi_vietnamese': 'vi-VN',
};

// === DARK MODE TOGGLE ===
toggle?.addEventListener('change', () => {
  document.documentElement.classList.toggle('dark', toggle.checked);
  document.querySelector('.dot')?.style.setProperty('transform', toggle.checked ? 'translateX(100%)' : 'translateX(0)');
});

// === HELPER FUNCTIONS ===
function getBibleVersionURL(languageKey) {
  return `https://raw.githubusercontent.com/victorzhunjie/parallel-bible/refs/heads/main/bible/${languageKey}.json`;
}

const loadedBibles = {};
async function importBible(versionKey) {
  if (loadedBibles[versionKey]) return loadedBibles[versionKey];
  try {
    const res = await fetch(getBibleVersionURL(versionKey));
    if (!res.ok) throw new Error('Failed to fetch Bible JSON');
    const json = await res.json();
    loadedBibles[versionKey] = json;
    return json;
  } catch (e) {
    showToast(`❌ Failed to load Bible version: ${versionKey}`);
    throw e;
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.replace('opacity-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.replace('opacity-100', 'opacity-0');
  }, 2500);
}

// === DROPDOWNS INITIALIZATION ===
async function tryEnableBookSelect() {
  const verA = versionA.value;
  const verB = versionB.value;
  if (verA && verB) {
    const jsonA = await importBible(verA);
    bookSelect.innerHTML = jsonA
      .map((book, idx) => `<option value="${idx}">${book.name}</option>`)
      .join('');
    bookSelect.disabled = false;
    loadBtn.disabled = false;
    comparisonContainer.innerHTML = '';
    chapterTitle.textContent = '—';
  }
}

versionA.addEventListener('change', tryEnableBookSelect);
versionB.addEventListener('change', tryEnableBookSelect);

bookSelect.addEventListener('change', async () => {
  const verA = versionA.value;
  const idxBook = parseInt(bookSelect.value, 10);
  chapterSelect.innerHTML = '<option value="">Select Chapter</option>';

  if (!verA || isNaN(idxBook)) {
    chapterSelect.disabled = true;
    return;
  }

  const json = await importBible(verA);
  const chapters = json[idxBook]?.chapters ?? [];
  chapterSelect.innerHTML += chapters.map((_, i) =>
    `<option value="${i}">Chapter ${i + 1}</option>`).join('');
  chapterSelect.disabled = false;
});

// === MAIN LOAD FUNCTION ===
loadBtn.addEventListener('click', async () => {
  const verA = versionA.value;
  const verB = versionB.value;
  const idxBook = parseInt(bookSelect.value, 10);
  const chapIdx = parseInt(chapterSelect.value, 10);
  const bookName = bookSelect.selectedOptions[0]?.text || '';

  queryWordSpan.textContent = bookName.toLowerCase();

  if (!verA || !verB || isNaN(idxBook) || isNaN(chapIdx)) {
    alert('Please select both Bible versions and a chapter.');
    return;
  }

  const [jsonA, jsonB] = await Promise.all([
    importBible(verA),
    importBible(verB)
  ]);

  const bookDataA = jsonA[idxBook];
  const bookDataB = jsonB[idxBook];

  const versesA = bookDataA.chapters[chapIdx] ?? [];
  const versesB = bookDataB.chapters[chapIdx] ?? [];

  chapterTitle.textContent = `${bookDataA.name} ${chapIdx + 1}`;
  titleA.textContent = versionA.selectedOptions[0]?.text ?? '';
  titleB.textContent = versionB.selectedOptions[0]?.text ?? '';
  comparisonContainer.innerHTML = '';

  const maxVerses = Math.max(versesA.length, versesB.length);
  const langAData = versionA.selectedOptions[0]?.dataset.lang;
  const langBData = versionB.selectedOptions[0]?.dataset.lang;

  for (let i = 0; i < maxVerses; i++) {
    const rowClass = (i % 2 === 0)
      ? 'bg-white dark:bg-gray-800'
      : 'bg-gray-100 dark:bg-gray-700';

    const textA = versesA[i] ?? '#';
    const textB = versesB[i] ?? '#';

    let cellA = `<div class="text-gray-900 dark:text-gray-100"><span class="font-semibold">${i + 1}</span> ${textA}</div>`;
    let cellB = `<div class="text-gray-900 dark:text-gray-100"><span class="font-semibold">${i + 1}</span> ${textB}</div>`;

    if (langAData === 'chi' && versesA[i]) {
      if (togglePinyin.checked) {
        const pinyin = window.pinyinPro.pinyin(textA, { toneType: 'none', type: 'array' }).join(' ');
        cellA += `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 pinyin">${pinyin}</div>`;
      }
      if (toggleCantonese.checked && toJyutping) {
        const canto = toJyutping.getJyutpingText(textA);
        cellA += `<div class="text-xs text-indigo-500 dark:text-indigo-300 mt-1 cantonese">${canto}</div>`;
      }
    }

    if (langBData === 'chi' && versesB[i]) {
      if (togglePinyin.checked) {
        const pinyin = window.pinyinPro.pinyin(textB, { toneType: 'none', type: 'array' }).join(' ');
        cellB += `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 pinyin">${pinyin}</div>`;
      }
      if (toggleCantonese.checked && toJyutping) {
        const canto = toJyutping.getJyutpingText(textB);
        cellB += `<div class="text-xs text-indigo-500 dark:text-indigo-300 mt-1 cantonese">${canto}</div>`;
      }
    }

    const ttsA = `<button class="text-blue-500 dark:text-blue-300 text-xs mt-1 speak-btn" data-text="${textA}" data-lang="${verA}" style="display: ${toggleTTS.checked ? 'inline-block' : 'none'}">🔊</button>`;
    const ttsB = `<button class="text-blue-500 dark:text-blue-300 text-xs mt-1 speak-btn" data-text="${textB}" data-lang="${verB}" style="display: ${toggleTTS.checked ? 'inline-block' : 'none'}">🔊</button>`;

    comparisonContainer.innerHTML += `
      <div class="${rowClass} grid grid-cols-1 sm:grid-cols-2 px-2 py-1">
        <div>${cellA}${ttsA}</div>
        <div>${cellB}${ttsB}</div>
      </div>`;
  }

  document.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      const langKey = btn.dataset.lang;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = ttsLangMap[langKey] === 'zh-CN' ? ttsLangSelect.value : (ttsLangMap[langKey] || 'en-US');
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    });
  });

  // Apply current toggles
  togglePinyin.dispatchEvent(new Event('change'));
  toggleCantonese.dispatchEvent(new Event('change'));
  toggleTTS.dispatchEvent(new Event('change'));

  const params = new URLSearchParams();
  params.set('bible1', verA);
  params.set('bible2', verB);
  params.set('book', idxBook);
  params.set('chapter', chapIdx);
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
});

// === TOGGLE EVENTS ===
togglePinyin.addEventListener('change', () => {
  document.querySelectorAll('.pinyin').forEach(el => {
    el.style.display = togglePinyin.checked ? 'block' : 'none';
  });
});

toggleCantonese.addEventListener('change', () => {
  document.querySelectorAll('.cantonese').forEach(el => {
    el.style.display = toggleCantonese.checked ? 'block' : 'none';
  });
});

toggleTTS.addEventListener('change', () => {
  document.querySelectorAll('.speak-btn').forEach(el => {
    el.style.display = toggleTTS.checked ? 'inline-block' : 'none';
  });
});

// === PERMALINK COPY ===
copyPermalinkBtn?.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast('Permalink copied to clipboard!'))
    .catch(err => {
      console.error('Copy failed:', err);
      showToast('❌ Failed to copy permalink.');
    });
});

// === LOAD STATE FROM URL ON START ===
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const b1 = params.get('bible1');
  const b2 = params.get('bible2');
  const bookParam = params.get('book');
  const chapterParam = params.get('chapter');

  if (b1 && b2 && bookParam !== null) {
    versionA.value = b1;
    versionB.value = b2;
    await tryEnableBookSelect();

    const idx = Number(bookParam);
    if (!isNaN(idx)) {
      bookSelect.value = idx;
      bookSelect.dispatchEvent(new Event('change'));

      const wait = setInterval(() => {
        if (chapterSelect.options.length > 1) {
          clearInterval(wait);
          if (!isNaN(chapterParam)) {
            chapterSelect.value = chapterParam;
          }
          loadBtn.click();
        }
      }, 100);
    }
  }
});
