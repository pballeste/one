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
  payment5Total: '',
  payment12Total: '',
};

const CURRENCY_FIELDS = new Set(['rentAmount', 'payment5Total', 'payment12Total']);

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
  const payment5Total = toNumber(formValues.payment5Total);
  const payment12Total = toNumber(formValues.payment12Total);
  const rentAmount = toNumber(formValues.rentAmount);
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
    payment5Total,
    payment5TotalFormatted: formatCurrency(payment5Total),
    payment5Installment: payment5Total / 5,
    payment5InstallmentFormatted: formatCurrency(payment5Total / 5),
    payment12Total,
    payment12TotalFormatted: formatCurrency(payment12Total),
    payment12Installment: payment12Total / 12,
    payment12InstallmentFormatted: formatCurrency(payment12Total / 12),
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

export default function App() {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [exportFormat, setExportFormat] = useState('jpg');
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const previewRef = useRef(null);
  const celebrationTimeoutRef = useRef(null);

  const record = buildRecord(formValues);
  const fileBaseName =
    sanitizeFileName(`${record.applicantName || 'cadastro'}-${record.roleName || record.roleLabel}`) ||
    'analise-credito-one';

  const rentLine = record.rentAmount
    ? `${record.rentAmountFormatted} taxas inclusas`
    : 'Informe o valor do aluguel';
  const payment5TotalText = record.payment5Total ? record.payment5TotalFormatted : 'A informar';
  const payment12TotalText = record.payment12Total ? record.payment12TotalFormatted : 'A informar';
  const payment5InstallmentText = record.payment5Total
    ? `5x de ${record.payment5InstallmentFormatted}`
    : '5 parcelas';
  const payment12InstallmentText = record.payment12Total
    ? `12x de ${record.payment12InstallmentFormatted}`
    : '12 parcelas';

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
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

  async function handleGenerateFiles() {
    if (
      !record.roleName ||
      !record.applicantName ||
      !record.applicantDocument ||
      !record.propertyStreet ||
      !record.propertyCity ||
      !record.propertyZip ||
      !record.rentAmount ||
      !record.payment5Total ||
      !record.payment12Total
    ) {
      setStatus('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setIsGenerating(true);
      setStatus('Gerando...');
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const posterWidth = previewRef.current.offsetWidth;
      const posterHeight = previewRef.current.offsetHeight;
      const scale = exportFormat === 'jpg' ? 1.9 : 1.55;

      const canvas = await html2canvas(previewRef.current, {
        scale,
        backgroundColor: '#081235',
        useCORS: true,
      });

      if (exportFormat === 'jpg') {
        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        await saveOutputRecord(fileBaseName, jpgBlob, 'jpg', 'image/jpeg', record);
        setStatus('Imagem gerada');
      } else {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [posterWidth, posterHeight],
          compress: true,
        });

        const imageData = canvas.toDataURL('image/png');
        pdf.addImage(imageData, 'PNG', 0, 0, posterWidth, posterHeight, undefined, 'FAST');

        await saveOutputRecord(fileBaseName, pdf.output('blob'), 'pdf', 'application/pdf', record);
        setStatus('PDF gerado');
      }

      triggerCelebration();
    } catch (error) {
      setStatus(`Não foi possível gerar o arquivo: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="app-shell">
      <main className="workspace">
        <section className="form-panel">
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

            <label className="field field-third">
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

            <label className="field field-third">
              Total à vista ou 5x
              <input
                name="payment5Total"
                value={formValues.payment5Total}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                inputMode="decimal"
                placeholder="16.800,00"
              />
            </label>

            <label className="field field-third">
              Total em 12x
              <input
                name="payment12Total"
                value={formValues.payment12Total}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                inputMode="decimal"
                placeholder="19.320,00"
              />
            </label>
          </div>

          <div className="review-strip">
            <div className="review-chip">
              <span>À vista</span>
              <strong>{payment5TotalText}</strong>
              <small>
                {record.payment5Total ? `ou em 5x de ${record.payment5InstallmentFormatted} no cartão` : 'ou em 5x'}
              </small>
            </div>

            <div className="review-chip">
              <span>Em 12x</span>
              <strong>{record.payment12Total ? record.payment12InstallmentFormatted : 'A informar'}</strong>
              <small>{record.payment12Total ? `total de ${payment12TotalText}` : 'total a informar'}</small>
            </div>
          </div>

          <div className="actions">
            <div className="action-stack">
              <div className="format-switch" role="tablist" aria-label="Formato de saída">
                <button
                  type="button"
                  className={`format-chip ${exportFormat === 'jpg' ? 'is-active' : ''}`}
                  onClick={() => setExportFormat('jpg')}
                >
                  JPG
                </button>
                <button
                  type="button"
                  className={`format-chip ${exportFormat === 'pdf' ? 'is-active' : ''}`}
                  onClick={() => setExportFormat('pdf')}
                >
                  PDF
                </button>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={handleGenerateFiles}
                disabled={isGenerating}
              >
                {isGenerating ? 'Gerando...' : exportFormat === 'jpg' ? 'Gerar JPG' : 'Gerar PDF'}
              </button>

              <span className={`status-text ${status ? 'is-visible' : ''}`}>{status}</span>

              <small className="export-hint">
                {exportFormat === 'jpg'
                  ? 'JPG recomendado para envio no WhatsApp.'
                  : 'PDF para arquivo e impressão.'}
              </small>

              {showCelebration ? <Celebration key={celebrationKey} /> : null}
            </div>
          </div>
        </section>

        <section className="preview-panel">
          <div className="preview-wrap">
            <div className="poster" ref={previewRef}>
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
                  primary={`À vista ${payment5TotalText} ou em 5x de ${
                    record.payment5Installment ? record.payment5InstallmentFormatted : 'A informar'
                  } no cartão`}
                />
                <PaymentItem
                  primary={`Em 12x de ${
                    record.payment12Installment ? record.payment12InstallmentFormatted : 'A informar'
                  } no cartão, total de ${payment12TotalText}`}
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
        </section>
      </main>
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
