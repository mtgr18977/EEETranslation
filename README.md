# EeeTranslation

Plataforma de tradução para textos técnicos construída com [Next.js](https://nextjs.org/) e [React](https://react.dev). O projeto utiliza TypeScript e Tailwind CSS para agilizar o desenvolvimento de interfaces modernas.

## Recursos principais

- Tradução de trechos utilizando diferentes provedores (Gemini, OpenAI ou Anthropic).
- Glossário e memória de tradução para manter consistência terminológica.
- Salvamento automático das preferências e do texto em progresso no navegador.
- Atalhos de teclado e painéis de qualidade para acelerar o fluxo de trabalho.

## Instalação

1. Clone o repositório e instale as dependências:

   ```bash
   pnpm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   ```

3. Para criar uma build de produção:

   ```bash
   pnpm build
   pnpm start
   ```

## Scripts úteis

- `pnpm dev` &ndash; executa a aplicação em modo de desenvolvimento.
- `pnpm build` &ndash; gera os arquivos otimizados para produção.
- `pnpm lint` &ndash; executa o linter do Next.js.

Os testes automatizados ficam em `__tests__`, mas não há um script de execução configurado no `package.json`.

## Estrutura do projeto

```
app/             # páginas e rotas do Next.js
components/      # componentes reutilizáveis
contexts/        # contextos React para estado global
hooks/           # hooks personalizados
public/          # arquivos públicos (imagens, etc.)
utils/           # utilidades e serviços de API
```

A pasta `app/actions` contém funções para chamadas de tradução no servidor, enquanto `styles/globals.css` define o estilo base.

## Licença

Este projeto é disponibilizado sem garantia alguma. Use à vontade e divirta-se traduzindo! :rocket:
