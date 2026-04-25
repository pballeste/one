import { useEffect, useRef, useState } from 'react';
import logo from './assets/logo-one.png';

const CONTACTS = [
  { state: 'SC', phone: '47 997371566' },
  { state: 'SP', phone: '11 917070012' },
  { state: 'PR', phone: '41 988071766' },
];

const BURST_PARTICLES = [
  { x: '-88px', y: '-94px', rotate: '-22deg', delay: '0ms', color: '#ffca3a' },
  { x: '-60px', y: '-118px', rotate: '18deg', delay: '20ms', color: '#ffffff' },
  { x: '-24px', y: '-104px', rotate: '-38deg', delay: '60ms', color: '#f7a823' },
  { x: '12px', y: '-126px', rotate: '24deg', delay: '40ms', color: '#ffc64a' },
  { x: '42px', y: '-108px', rotate: '-18deg', delay: '80ms', color: '#ffffff' },
  { x: '76px', y: '-88px', rotate: '34deg', delay: '30ms', color: '#f7a823' },
  { x: '-102px', y: '-52px', rotate: '28deg', delay: '100ms', color: '#ffffff' },
  { x: '98px', y: '-54px', rotate: '-28deg', delay: '90ms', color: '#ffca3a' },
  { x: '-72px', y: '-18px', rotate: '42deg', delay: '120ms', color: '#f7a823' },
  { x: '70px', y: '-14px', rotate: '-42deg', delay: '70ms', color: '#ffffff' },
  { x: '-32px', y: '-70px', rotate: '12deg', delay: '110ms', color: '#ffca3a' },
  { x: '34px', y: '-68px', rotate: '-12deg', delay: '50ms', color: '#f7a823' },
];

const INITIAL_FORM = {
  roleType: 'corretor',
  roleName: '',
  applicantName: '',
  applicantDocumentType: 'cpf',
  applicantDocument: '',
  propertyStreet: '',
  propertyNeighborhood: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  rentAmount: '',
};

const CURRENCY_FIELDS = new Set(['rentAmount']);
const POSTER_BASE_WIDTH = 560;
const POSTER_BASE_HEIGHT = Math.round((POSTER_BASE_WIDTH * 1491) / 1055);

function joinParts(parts, separator = ', ') {
  return parts.map((item) => item?.trim()).filter(Boolean).join(separator);
}

function toNumber(value) {
  if (!value) {
    return 0;
  }

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function formatCurrencyInput(value) {
  const cleaned = String(value).replace(/[^\d,]/g, '');

  if (!cleaned) {
    return '';
  }

  const [integerPartRaw = '', decimalRaw = ''] = cleaned.split(',');
  const integerDigits = integerPartRaw.replace(/\D/g, '');
  const integerValue = integerDigits ? Number(integerDigits) : 0;
  const integerFormatted = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(integerValue);

  if (!cleaned.includes(',')) {
    return integerFormatted;
  }

  return `${integerFormatted},${decimalRaw.replace(/\D/g, '').slice(0, 2)}`;
}

function formatCurrencyInputOnBlur(value) {
  const numericValue = toNumber(value);
  return numericValue ? formatCurrency(numericValue).replace('R$', '').trim() : '';
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatPhone(value) {
  const digits = String(value).replace(/\D/g, '');

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2-$3');
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2-$3');
  }

  return value;
}

function formatZip(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return digits.replace(/(\d{5})(\d{1,3})/, '$1-$2');
}

function formatDocument(value, type) {
  const digits = String(value).replace(/\D/g, '');

  if (type === 'cnpj') {
    const limited = digits.slice(0, 14);

    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return limited.replace(/^(\d{2})(\d+)/, '$1.$2');
    if (limited.length <= 8) return limited.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (limited.length <= 12) return limited.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return limited.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
  }

  const limited = digits.slice(0, 11);

  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return limited.replace(/(\d{3})(\d+)/, '$1.$2');
  if (limited.length <= 9) return limited.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return limited.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

function sanitizeFileName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function buildRecord(formValues) {
  const rentAmount = toNumber(formValues.rentAmount);
  const insuranceAmount = roundCurrency(rentAmount * 1.2);
  const cashAmount = insuranceAmount;
  const payment5Total = roundCurrency(insuranceAmount * 1.1);
  const payment12Total = roundCurrency(insuranceAmount * 1.15);
  const payment5Installment = roundCurrency(payment5Total / 5);
  const payment12Installment = roundCurrency(payment12Total / 12);
  const roleLabel = formValues.roleType === 'imobiliaria' ? 'Imobiliária' : 'Corretor';
  const applicantDocumentType = formValues.applicantDocumentType === 'cnpj' ? 'cnpj' : 'cpf';
  const applicantDocumentLabel = applicantDocumentType.toUpperCase();
  const applicantDocumentFormatted = formatDocument(formValues.applicantDocument, applicantDocumentType);
  const propertyStreet = formValues.propertyStreet.trim();
  const propertyNeighborhood = formValues.propertyNeighborhood.trim();
  const propertyCity = formValues.propertyCity.trim();
  const propertyState = formValues.propertyState.trim().toUpperCase();
  const propertyZip = formValues.propertyZip.trim();
  const propertyLine1 = propertyNeighborhood ? joinParts([propertyStreet, propertyNeighborhood]) : propertyStreet;
  const propertyLine2 = propertyState ? joinParts([propertyCity, propertyState, propertyZip]) : joinParts([propertyCity, propertyZip]);

  return {
    createdAt: new Date().toISOString(),
    roleType: formValues.roleType,
    roleLabel,
    roleName: formValues.roleName.trim(),
    applicantName: formValues.applicantName.trim(),
    applicantDocumentType,
    applicantDocumentLabel,
    applicantDocument: applicantDocumentFormatted,
    propertyStreet,
    propertyNeighborhood,
    propertyCity,
    propertyState,
    propertyZip,
    propertyLine1,
    propertyLine2,
    propertyAddress: [propertyLine1, propertyLine2].filter(Boolean).join('\n'),
    rentAmount,
    rentAmountFormatted: formatCurrency(rentAmount),
    insuranceAmount,
    insuranceAmountFormatted: formatCurrency(insuranceAmount),
    cashAmount,
    cashAmountFormatted: formatCurrency(cashAmount),
    payment5Total,
    payment5TotalFormatted: formatCurrency(payment5Total),
    payment5Installment,
    payment5InstallmentFormatted: formatCurrency(payment5Installment),
    payment12Total,
    payment12TotalFormatted: formatCurrency(payment12Total),
    payment12Installment,
    payment12InstallmentFormatted: formatCurrency(payment12Installment),
    contacts: CONTACTS.map((contact) => ({ ...contact, phoneFormatted: formatPhone(contact.phone) })),
  };
}

function persistRecord(record) {
  try {
    const current = JSON.parse(localStorage.getItem('one-fianca-history') || '[]');
    localStorage.setItem('one-fianca-history', JSON.stringify([record, ...current].slice(0, 40)));
  } catch {
    // Local persistence is optional; ignore quota/storage errors.
  }
}

async function saveFile(fileName, content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: mimeType,
          accept: { [mimeType]: [`.${fileName.split('.').pop()}`] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Falha ao gerar o arquivo.'));
    }, mimeType, quality);
  });
}

async function saveOutputRecord(baseName, fileBlob, extension, mimeType, record) {
  persistRecord(record);

  if ('showDirectoryPicker' in window) {
    const directoryHandle = await window.showDirectoryPicker();
    const fileHandle = await directoryHandle.getFileHandle(`${baseName}.${extension}`, {
      create: true,
    });
    const jsonHandle = await directoryHandle.getFileHandle(`${baseName}.json`, { create: true });

    const fileWritable = await fileHandle.createWritable();
    await fileWritable.write(fileBlob);
    await fileWritable.close();

    const jsonWritable = await jsonHandle.createWritable();
    await jsonWritable.write(JSON.stringify(record, null, 2));
    await jsonWritable.close();
    return;
  }

  await saveFile(`${baseName}.${extension}`, fileBlob, mimeType);
}

function createExportPoster(sourceNode) {
  const stage = document.createElement('div');
  stage.className = 'poster-export-stage';
  Object.assign(stage.style, {
    position: 'fixed',
    left: '-20000px',
    top: '0',
    width: `${POSTER_BASE_WIDTH}px`,
    minHeight: `${POSTER_BASE_HEIGHT}px`,
    padding: '0',
    margin: '0',
    pointerEvents: 'none',
    opacity: '1',
    overflow: 'visible',
    zIndex: '-1',
    background: '#081235',
  });

  const clone = sourceNode.cloneNode(true);
  clone.style.width = `${POSTER_BASE_WIDTH}px`;
  clone.style.minHeight = `${POSTER_BASE_HEIGHT}px`;
  clone.style.height = 'auto';
  clone.style.maxWidth = 'none';
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top center';

  stage.appendChild(clone);
  document.body.appendChild(stage);

  return { stage, clone };
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function getPosterExportHeight(stage, poster) {
  return Math.ceil(
    Math.max(
      POSTER_BASE_HEIGHT,
      stage.scrollHeight,
      stage.offsetHeight,
      poster.scrollHeight,
      poster.offsetHeight,
      poster.clientHeight,
      poster.getBoundingClientRect().height,
    ),
  );
}

export default function App() {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [mobileSection, setMobileSection] = useState('form');
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(POSTER_BASE_HEIGHT);
  const previewRef = useRef(null);
  const previewStageRef = useRef(null);
  const formPanelRef = useRef(null);
  const previewPanelRef = useRef(null);
  const celebrationTimeoutRef = useRef(null);

  const record = buildRecord(formValues);
  const fileBaseName =
    sanitizeFileName(`${record.applicantName || 'cadastro'}-${record.roleName || record.roleLabel}`) ||
    'analise-credito-one';

  const rentLine = record.rentAmount
    ? record.rentAmountFormatted
    : 'Informe o valor do aluguel';
  const insuranceText = record.rentAmount ? record.insuranceAmountFormatted : 'A informar';
  const cashText = record.rentAmount ? record.cashAmountFormatted : 'A informar';
  const payment5TotalText = record.rentAmount ? record.payment5TotalFormatted : 'A informar';
  const payment12TotalText = record.rentAmount ? record.payment12TotalFormatted : 'A informar';
  const payment5InstallmentText = record.rentAmount ? record.payment5InstallmentFormatted : 'A informar';
  const payment12InstallmentText = record.rentAmount ? record.payment12InstallmentFormatted : 'A informar';

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !previewStageRef.current) {
      return undefined;
    }

    const stage = previewStageRef.current;

    const updateScale = () => {
      const nextScale = Math.min(1, stage.clientWidth / POSTER_BASE_WIDTH);
      setPreviewScale(nextScale || 1);
      if (previewRef.current) {
        setPreviewHeight(Math.max(POSTER_BASE_HEIGHT, previewRef.current.scrollHeight));
      }
    };

    updateScale();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => updateScale());
      observer.observe(stage);
      if (previewRef.current) {
        observer.observe(previewRef.current);
      }
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return undefined;
    }

    const sections = [
      ['form', formPanelRef.current],
      ['preview', previewPanelRef.current],
    ].filter(([, node]) => node);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!activeEntry) {
          return;
        }

        const activeSection = sections.find(([, node]) => node === activeEntry.target)?.[0];

        if (activeSection) {
          setMobileSection(activeSection);
        }
      },
      {
        threshold: [0.24, 0.45, 0.66],
        rootMargin: '-12% 0px -30% 0px',
      },
    );

    sections.forEach(([, node]) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    if (CURRENCY_FIELDS.has(name)) {
      setFormValues((current) => ({ ...current, [name]: formatCurrencyInput(value) }));
      return;
    }

    if (name === 'propertyState') {
      setFormValues((current) => ({
        ...current,
        [name]: value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
      }));
      return;
    }

    if (name === 'propertyZip') {
      setFormValues((current) => ({ ...current, [name]: formatZip(value) }));
      return;
    }

    if (name === 'applicantDocumentType') {
      setFormValues((current) => ({
        ...current,
        applicantDocumentType: value,
        applicantDocument: formatDocument(current.applicantDocument, value),
      }));
      return;
    }

    if (name === 'applicantDocument') {
      setFormValues((current) => ({
        ...current,
        applicantDocument: formatDocument(value, current.applicantDocumentType),
      }));
      return;
    }

    setFormValues((current) => ({ ...current, [name]: value }));
  }

  function handleFieldBlur(event) {
    const { name, value } = event.target;

    if (!CURRENCY_FIELDS.has(name)) {
      return;
    }

    setFormValues((current) => ({
      ...current,
      [name]: formatCurrencyInputOnBlur(value),
    }));
  }

  function triggerCelebration() {
    setCelebrationKey((current) => current + 1);
    setShowCelebration(true);

    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setShowCelebration(false);
    }, 1500);
  }

  function scrollToMobileSection(section) {
    const nextRef = section === 'preview' ? previewPanelRef : formPanelRef;
    setMobileSection(section);
    nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleGenerateFiles() {
    if (
      !record.roleName ||
      !record.applicantName ||
      !record.applicantDocument ||
      !record.propertyStreet ||
      !record.propertyCity ||
      !record.propertyZip ||
      !record.rentAmount
    ) {
      setStatus('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setIsGenerating(true);
      setStatus('Preparando imagem...');
      const { default: html2canvas } = await import('html2canvas');

      const { stage: exportStage, clone: exportPoster } = createExportPoster(previewRef.current);
      const scale = 1.9;

      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        await waitForNextFrame();
        await waitForNextFrame();

        const exportHeight = getPosterExportHeight(exportStage, exportPoster);
        exportStage.style.height = `${exportHeight}px`;
        exportStage.style.minHeight = `${exportHeight}px`;
        exportPoster.style.height = `${exportHeight}px`;
        exportPoster.style.minHeight = `${exportHeight}px`;

        await waitForNextFrame();

        const canvas = await html2canvas(exportStage, {
          scale,
          backgroundColor: '#081235',
          useCORS: true,
          width: POSTER_BASE_WIDTH,
          height: exportHeight,
          windowWidth: POSTER_BASE_WIDTH,
          windowHeight: exportHeight,
          scrollX: 0,
          scrollY: 0,
        });

        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        const shareSupported =
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' &&
          typeof File !== 'undefined';

        if (shareSupported) {
          const shareFile = new File([jpgBlob], `${fileBaseName}.jpg`, {
            type: 'image/jpeg',
          });
          const canShareFile = !navigator.canShare || navigator.canShare({ files: [shareFile] });

          if (canShareFile) {
            await navigator.share({
              files: [shareFile],
            });
            persistRecord(record);
            setStatus('Imagem compartilhada');
          } else {
            await saveOutputRecord(fileBaseName, jpgBlob, 'jpg', 'image/jpeg', record);
            setStatus('Imagem baixada');
          }
        } else {
          await saveOutputRecord(fileBaseName, jpgBlob, 'jpg', 'image/jpeg', record);
          setStatus('Imagem baixada');
        }
      } finally {
        exportStage.remove();
      }

      triggerCelebration();

      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches) {
        requestAnimationFrame(() => {
          scrollToMobileSection('preview');
        });
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('');
      } else {
        setStatus(`Não foi possível compartilhar: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="mobile-nav" aria-label="Navegação móvel">
        <button
          type="button"
          className={`mobile-nav-chip ${mobileSection === 'form' ? 'is-active' : ''}`}
          onClick={() => scrollToMobileSection('form')}
        >
          Dados
        </button>
        <button
          type="button"
          className={`mobile-nav-chip ${mobileSection === 'preview' ? 'is-active' : ''}`}
          onClick={() => scrollToMobileSection('preview')}
        >
          Prévia
        </button>
      </div>

      <main className="workspace">
        <section ref={formPanelRef} className="form-panel panel-anchor">
          <div className="form-head">
            <img src={logo} alt="Logo ONE Fiança Locatícia" className="form-head-logo" />
            <div className="form-head-copy">
              <span className="eyebrow">ONE FIANÇA LOCATÍCIA</span>
              <h1>Comprovante Crédito Aprovado</h1>
            </div>
          </div>

          <div className="form-grid">
            <label className="field field-type">
              Tipo
              <select name="roleType" value={formValues.roleType} onChange={handleFieldChange}>
                <option value="corretor">Corretor</option>
                <option value="imobiliaria">Imobiliária</option>
              </select>
            </label>

            <label className="field field-role">
              {record.roleLabel}
              <input
                name="roleName"
                value={formValues.roleName}
                onChange={handleFieldChange}
                placeholder={`Nome do ${record.roleLabel.toLowerCase()}`}
              />
            </label>

            <label className="field field-full">
              Nome do cadastro aprovado
              <input
                name="applicantName"
                value={formValues.applicantName}
                onChange={handleFieldChange}
                placeholder="Carlos Eduardo Costa Netto"
              />
            </label>

            <label className="field field-type">
              CPF ou CNPJ
              <select name="applicantDocumentType" value={formValues.applicantDocumentType} onChange={handleFieldChange}>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </label>

            <label className="field field-role">
              {record.applicantDocumentLabel}
              <input
                name="applicantDocument"
                value={formValues.applicantDocument}
                onChange={handleFieldChange}
                inputMode="numeric"
                placeholder={formValues.applicantDocumentType === 'cnpj' ? '12.345.678/0001-90' : '123.456.789-00'}
              />
            </label>

            <label className="field field-full">
              Endereço e Bairro
              <input
                name="propertyStreet"
                value={formValues.propertyStreet}
                onChange={handleFieldChange}
                placeholder="Alameda Ipê, 328 apto 237, Vila Ilda"
              />
            </label>

            <label className="field field-city-state">
              Cidade e Estado
              <input
                name="propertyCity"
                value={formValues.propertyCity}
                onChange={handleFieldChange}
                placeholder="São Paulo, SP"
              />
            </label>

            <label className="field field-zip field-zip-compact">
              CEP
              <input
                name="propertyZip"
                value={formValues.propertyZip}
                onChange={handleFieldChange}
                inputMode="numeric"
                placeholder="04059-005"
              />
            </label>

            <label className="field field-full">
              Valor do aluguel
              <input
                name="rentAmount"
                value={formValues.rentAmount}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                inputMode="decimal"
                placeholder="14.000,00"
              />
            </label>
          </div>

          <div className="review-strip">
            <div className="review-chip">
              <span>À vista</span>
              <strong>{cashText}</strong>
              <small>{record.rentAmount ? `seguro: ${insuranceText}` : 'seguro: A informar'}</small>
            </div>

            <div className="review-chip">
              <span>Em 5x</span>
              <strong>{payment5InstallmentText}</strong>
              <small>{record.rentAmount ? `total de ${payment5TotalText}` : 'total a informar'}</small>
            </div>

            <div className="review-chip">
              <span>Em 12x</span>
              <strong>{payment12InstallmentText}</strong>
              <small>{record.rentAmount ? `total de ${payment12TotalText}` : 'total a informar'}</small>
            </div>
          </div>

          <ActionControls
            className="actions actions-desktop"
            isGenerating={isGenerating}
            onGenerate={handleGenerateFiles}
            status={status}
            showCelebration={showCelebration}
            celebrationKey={celebrationKey}
          />
        </section>

        <section ref={previewPanelRef} className="preview-panel panel-anchor">
          <div className="preview-wrap">
            <div
              ref={previewStageRef}
              className="preview-stage"
              style={{ '--preview-height': `${previewHeight * previewScale}px` }}
            >
              <div
                className="poster"
                ref={previewRef}
                style={{
                  width: `${POSTER_BASE_WIDTH}px`,
                  minHeight: `${POSTER_BASE_HEIGHT}px`,
                  transform: `scale(${previewScale})`,
                }}
              >
                <div className="poster-glow" />
                <img className="poster-logo" src={logo} alt="Logo ONE Fiança Locatícia" />

                <div className="poster-title">ANÁLISE DE CRÉDITO APROVADA</div>

                <div className="poster-info-card">
                  <PosterRow
                    icon="user"
                    value={`${record.roleLabel}: ${record.roleName || `Nome do ${record.roleLabel.toLowerCase()}`}`}
                  />
                  <PosterRow
                    icon="shield"
                    eyebrow="Cadastro aprovado em nome de"
                    value={record.applicantName || 'Nome do cliente'}
                  />
                  <PosterRow
                    icon="document"
                    eyebrow={record.applicantDocumentLabel}
                    value={record.applicantDocument || `${record.applicantDocumentLabel} do cliente`}
                  />
                  <PosterRow
                    icon="home"
                    eyebrow="Dados do Imóvel"
                    value={record.propertyAddress || 'Endereço do imóvel'}
                    tone="soft"
                  />
                  <PosterRow icon="money" eyebrow="Valor aluguel" value={rentLine} tone="soft" />
                  <PosterRow icon="card" eyebrow="Valor do seguro" value={insuranceText} tone="soft" />
                </div>

                <div className="payment-card">
                  <div className="payment-heading">
                    <div className="payment-line" />
                    <div className="payment-title">
                      <Icon name="card" />
                      <span>FORMAS DE PAGAMENTO</span>
                    </div>
                    <div className="payment-line" />
                  </div>

                  <PaymentItem
                    primary={`À vista: ${cashText}`}
                  />
                  <PaymentItem
                    primary={`Em 5x no cartão: 5x de ${payment5InstallmentText}, total de ${payment5TotalText}`}
                  />
                  <PaymentItem
                    primary={`Em 12x no cartão: 12x de ${payment12InstallmentText}, total de ${payment12TotalText}`}
                  />
                </div>

                <div className="contact-bar">
                  {record.contacts.map((contact) => (
                    <div key={contact.state} className="contact-item">
                      <div className="contact-icon">
                        <Icon name="phone" />
                      </div>
                      <div className="contact-copy">
                        <span>{contact.state}</span>
                        <strong>{contact.phoneFormatted}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="poster-arc" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <ActionControls
        className="mobile-dock"
        stackClassName="mobile-dock-card"
        isGenerating={isGenerating}
        onGenerate={handleGenerateFiles}
        status={status}
        showCelebration={showCelebration}
        celebrationKey={celebrationKey}
      />
    </div>
  );
}

function ActionControls({
  className = '',
  stackClassName = 'action-stack',
  isGenerating,
  onGenerate,
  status,
  showCelebration,
  celebrationKey,
}) {
  return (
    <div className={className}>
      <div className={stackClassName}>
        <button type="button" className="primary-button" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Preparando...' : 'Compartilhar'}
        </button>

        <span className={`status-text ${status ? 'is-visible' : ''}`}>{status}</span>

        {showCelebration ? <Celebration key={celebrationKey} /> : null}
      </div>
    </div>
  );
}

function PosterRow({ icon, eyebrow, value, tone = 'default' }) {
  return (
    <div className="poster-row">
      <div className="poster-row-icon">
        <Icon name={icon} />
      </div>
      <div className={`poster-row-text poster-row-text-${tone}`}>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PaymentItem({ primary }) {
  return (
    <div className="payment-item">
      <div className="payment-bullet" />
      <div className="payment-copy">
        <p>{primary}</p>
      </div>
    </div>
  );
}

function Celebration() {
  return (
    <div className="celebration" aria-hidden="true">
      {BURST_PARTICLES.map((particle, index) => (
        <span
          key={`${particle.x}-${particle.y}-${index}`}
          className="confetti"
          style={{
            '--x': particle.x,
            '--y': particle.y,
            '--rotate': particle.rotate,
            '--delay': particle.delay,
            '--color': particle.color,
          }}
        />
      ))}
    </div>
  );
}

function Icon({ name }) {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c0-3.2 3.1-5.5 7-5.5s7 2.3 7 5.5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.5 18 6v5.7c0 4.3-2.8 6.9-6 8.3-3.2-1.4-6-4-6-8.3V6l6-2.5Z" />
        <path d="m9.5 12.4 1.7 1.7 3.6-4.2" />
      </>
    ),
    document: (
      <>
        <path d="M8 3.8h6.6L18.2 7v13.2H8z" />
        <path d="M14.4 3.8V7h3.2" />
        <path d="M10.3 10.2h5.4" />
        <path d="M10.3 13h5.4" />
        <path d="M10.3 15.8h3.8" />
      </>
    ),
    home: (
      <>
        <path d="M4.5 11.5 12 5l7.5 6.5" />
        <path d="M7 10.5V19h10v-8.5" />
        <path d="M10 19v-4.5h4V19" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <path d="M14.6 8.7c-.6-.5-1.5-.8-2.4-.8-1.8 0-3 .9-3 2.2 0 1.2.9 1.9 3.2 2.4 2 .4 2.9 1 2.9 2.3 0 1.4-1.2 2.4-3.1 2.4-1.1 0-2.3-.3-3.2-1" />
        <path d="M12 7v10" />
      </>
    ),
    card: (
      <>
        <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
        <path d="M3.5 10.5h17" />
        <path d="M16 14.5h2.5" />
      </>
    ),
    phone: (
      <>
        <path d="M8 5.5h2.6l1.2 3.3-1.7 1.7a14.7 14.7 0 0 0 3.2 3.7 14.6 14.6 0 0 0 3.7 3.1l1.7-1.6 3.3 1.2v2.6c0 .8-.7 1.5-1.5 1.5-8.7 0-15.8-7.1-15.8-15.8 0-.8.7-1.5 1.5-1.5Z" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}
