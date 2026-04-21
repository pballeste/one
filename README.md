# ONE Fiança Locatícia

App front-end para gerar a arte de análise de crédito da ONE Fiança Locatícia com:

- preview em tempo real;
- exportação em PDF vertical, pensado para compartilhamento no WhatsApp;
- exportação dos mesmos dados em JSON;
- funcionamento sem backend obrigatório.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. O projeto já está pronto para detecção automática com Vite.
3. Confirme:
   `Build Command`: `npm run build`
   `Output Directory`: `dist`
4. Faça o deploy.

## Observações

- Em navegadores Chromium, o app usa a File System Access API para permitir ao usuário escolher onde salvar.
- Em Safari e parte dos navegadores móveis, PDF e JSON serão baixados para a pasta padrão de downloads.
- O projeto usa `base: "./"` no Vite para facilitar deploy estático em Vercel, Netlify ou GitHub Pages.
