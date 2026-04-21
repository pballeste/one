import { useRef, useState } from 'react';
import logo from './assets/logo-one.png';

const CONTACTS = [
  { state: 'SC', phone: '47 997371566' },
  { state: 'SP', phone: '11 917070012' },
  { state: 'PR', phone: '41 988071766' },
];

const INITIAL_FORM = {
  roleType: 'corretor',
  roleName: '',
  applicantName: '',
  propertyAddress: '',
  rentAmount: '',
  payment5Total: '',
  payment12Total: '',
};

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

  return {
    createdAt: new Date().toISOString(),
    roleType: formValues.roleType,
    roleLabel,
    roleName: formValues.roleName.trim(),
    applicantName: formValues.applicantName.trim(),
    propertyAddress: formValues.propertyAddress.trim(),
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
    contacts: CONTACTS,
  };
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

async function saveFilesTogether(baseName, pdfBlob, record) {
  if ('showDirectoryPicker' in window) {
    const directoryHandle = await window.showDirectoryPicker();
    const pdfHandle = await directoryHandle.getFileHandle(`${baseName}.pdf`, { create: true });
    const jsonHandle = await directoryHandle.getFileHandle(`${baseName}.json`, { create: true });

    const pdfWritable = await pdfHandle.createWritable();
    await pdfWritable.write(pdfBlob);
    await pdfWritable.close();

    const jsonWritable = await jsonHandle.createWritable();
    await jsonWritable.write(JSON.stringify(record, null, 2));
    await jsonWritable.close();
    return 'Arquivos salvos na pasta escolhida.';
  }

  await saveFile(`${baseName}.pdf`, pdfBlob, 'application/pdf');
  await saveFile(`${baseName}.json`, JSON.stringify(record, null, 2), 'application/json');
  return 'Arquivos baixados. Neste navegador, o local final depende da pasta padrão de downloads.';
}

export default function App() {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);

  const record = buildRecord(formValues);
  const fileBaseName =
    sanitizeFileName(`${record.applicantName || 'cadastro'}-${record.roleName || record.roleLabel}`) ||
    'analise-credito-one';

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  async function handleGenerateFiles() {
    if (!record.roleName || !record.applicantName || !record.propertyAddress) {
      setStatus('Preencha nome do corretor/imobiliária, cadastro e endereço do imóvel.');
      return;
    }

    try {
      setIsGenerating(true);
      setStatus('Gerando PDF e JSON...');
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#050b24',
        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1920],
      });

      const imageData = canvas.toDataURL('image/png');
      pdf.addImage(imageData, 'PNG', 0, 0, 1080, 1920);

      const saveStatus = await saveFilesTogether(fileBaseName, pdf.output('blob'), record);
      setStatus(saveStatus);
    } catch (error) {
      setStatus(`Não foi possível gerar os arquivos: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="app-shell">
      <section className="intro-panel">
        <div className="intro-copy">
          <span className="eyebrow">ONE Fiança Locatícia</span>
          <h1>Gerador de análise de crédito com PDF para WhatsApp.</h1>
          <p>
            Preencha os dados, revise os valores parcelados e exporte o material em PDF e JSON
            sem depender de backend.
          </p>
        </div>
      </section>

      <main className="workspace">
        <section className="form-panel">
          <div className="panel-header">
            <h2>Dados da análise</h2>
            <p>O layout já sai ajustado para envio vertical no WhatsApp.</p>
          </div>

          <div className="form-grid">
            <label>
              Tipo
              <select name="roleType" value={formValues.roleType} onChange={handleFieldChange}>
                <option value="corretor">Corretor</option>
                <option value="imobiliaria">Imobiliária</option>
              </select>
            </label>

            <label>
              {record.roleLabel}
              <input
                name="roleName"
                value={formValues.roleName}
                onChange={handleFieldChange}
                placeholder={`Nome do ${record.roleLabel.toLowerCase()}`}
              />
            </label>

            <label>
              Nome do cadastro aprovado
              <input
                name="applicantName"
                value={formValues.applicantName}
                onChange={handleFieldChange}
                placeholder="Carlos Eduardo Costa Netto"
              />
            </label>

            <label className="span-2">
              Endereço do imóvel
              <textarea
                name="propertyAddress"
                value={formValues.propertyAddress}
                onChange={handleFieldChange}
                rows="3"
                placeholder="Av. Juriti, 235 apto 42, Moema, São Paulo, SP 04520-000"
              />
            </label>

            <label>
              Valor do aluguel
              <input
                name="rentAmount"
                value={formValues.rentAmount}
                onChange={handleFieldChange}
                inputMode="decimal"
                placeholder="14.000,00"
              />
            </label>

            <label>
              Total à vista ou em 5x
              <input
                name="payment5Total"
                value={formValues.payment5Total}
                onChange={handleFieldChange}
                inputMode="decimal"
                placeholder="16.800,00"
              />
            </label>

            <label>
              Total em 12x
              <input
                name="payment12Total"
                value={formValues.payment12Total}
                onChange={handleFieldChange}
                inputMode="decimal"
                placeholder="19.320,00"
              />
            </label>
          </div>

          <div className="review-card">
            <h3>Revisão automática</h3>
            <div className="review-grid">
              <div>
                <span>5 parcelas</span>
                <strong>{record.payment5InstallmentFormatted}</strong>
                <small>Total: {record.payment5TotalFormatted}</small>
              </div>
              <div>
                <span>12 parcelas</span>
                <strong>{record.payment12InstallmentFormatted}</strong>
                <small>Total: {record.payment12TotalFormatted}</small>
              </div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="primary-button" onClick={handleGenerateFiles} disabled={isGenerating}>
              {isGenerating ? 'Gerando...' : 'Gerar PDF + JSON'}
            </button>
            <p>{status || 'O JSON acompanha os mesmos dados do PDF para histórico interno.'}</p>
          </div>
        </section>

        <section className="preview-panel">
          <div className="phone-frame">
            <div className="poster" ref={previewRef}>
              <div className="poster-noise" />
              <img className="poster-logo" src={logo} alt="Logo ONE Fiança Locatícia" />

              <div className="title-banner">
                <span>ANÁLISE de CRÉDITO</span>
                <strong>ONE</strong>
                <span>FIANÇA LOCATÍCIA</span>
              </div>

              <div className="info-card">
                <InfoRow label={record.roleLabel} value={record.roleName || `Nome do ${record.roleLabel.toLowerCase()}`} />
                <InfoRow label="Cadastro One Aprovado em nome de" value={record.applicantName || 'Nome do cliente'} />
                <InfoRow label="Imóvel residencial" value={record.propertyAddress || 'Endereço completo do imóvel'} />
                <InfoRow label="Valor aluguel" value={`${record.rentAmountFormatted} taxas inclusas`} />
              </div>

              <div className="payment-card">
                <div className="section-title">FORMAS DE PAGAMENTO</div>
                <PaymentRow
                  text="Pagamento à vista ou em 5 vezes sem acréscimo no cartão de crédito"
                  total={record.payment5TotalFormatted}
                  installment={`5x de ${record.payment5InstallmentFormatted}`}
                />
                <PaymentRow
                  text="Valor para pagamento em 12 vezes no cartão de crédito"
                  total={record.payment12TotalFormatted}
                  installment={`12x de ${record.payment12InstallmentFormatted}`}
                />
              </div>

              <div className="contacts">
                {CONTACTS.map((contact) => (
                  <div key={contact.state} className="contact-pill">
                    <span>{contact.state}</span>
                    <strong>{contact.phone}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PaymentRow({ text, total, installment }) {
  return (
    <div className="payment-row">
      <p>{text}</p>
      <strong>{total}</strong>
      <span>{installment}</span>
    </div>
  );
}
