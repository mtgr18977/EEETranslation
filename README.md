# 🌐 EEETranslate

Uma plataforma moderna de tradução para conteúdo técnico, desenvolvida com Next.js e React.

## ✨ Recursos

- **Tradução segmentada**: Tradução por segmentos para maior precisão e controle
- **Tradução automática**: Integração com Google Translate e LibreTranslate
- **Memória de tradução**: Armazenamento e reutilização de traduções anteriores
- **Glossário técnico**: Destaque de termos técnicos e suas definições
- **Verificação de qualidade**: Detecção automática de problemas de tradução
- **Análise de leiturabilidade**: Métricas de complexidade do texto
- **Alinhamento visual**: Visualização lado a lado de elementos correspondentes

2. Instale as dependências:

```shellscript
npm install
# ou
yarn install
```


3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```plaintext
# Google Translate API (opcional)
GOOGLE_API_KEY=sua_chave_api_google

# LibreTranslate (opcional)
LIBRE_API_URL=https://pt.libretranslate.com/translate
```


4. Inicie o servidor de desenvolvimento:

```shellscript
npm run dev
# ou
yarn dev
```


5. Acesse a aplicação em `http://localhost:3000`


## 📖 Como usar

### Upload de texto

1. Clique no botão "Upload" na barra de navegação
2. Selecione um arquivo de texto ou Markdown
3. O texto será carregado e segmentado automaticamente


### Tradução de segmentos

1. Navegue entre os segmentos usando as setas do teclado ou clicando neles
2. Digite a tradução diretamente no campo de texto
3. Use o botão "Suggest" para obter uma sugestão de tradução automática
4. Aceite ou rejeite a sugestão conforme necessário


### Verificação de qualidade

1. Problemas de qualidade são destacados automaticamente em cada segmento
2. Clique em "Mostrar detalhes" para ver informações específicas sobre os problemas
3. Corrija os problemas conforme necessário


### Uso do glossário

1. Clique no botão "Glossário" na barra de navegação
2. Pesquise termos específicos
3. Termos do glossário são destacados automaticamente no texto fonte


### Exportação

1. Clique no botão "Download" para baixar o texto traduzido
2. Após salvar a tradução, você pode exportar um relatório de qualidade


## 🔧 Configuração de APIs de tradução

### Google Translate API

1. Crie uma conta no [Google Cloud Console](https://console.cloud.google.com/)
2. Ative a API Cloud Translation
3. Crie uma chave de API
4. Adicione a chave nas configurações da plataforma (botão "API" na barra de navegação)


### LibreTranslate

Por padrão, a plataforma usa a instância pública do LibreTranslate. Para usar sua própria instância:

1. [Instale o LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) em seu servidor
2. Atualize a URL da API nas configurações da plataforma


## 📁 Estrutura do projeto

```
translation-platform/
├── app/                  # Diretório principal do Next.js App Router
│   ├── actions/          # Server Actions
│   ├── api/              # API Routes
│   └── page.tsx          # Página principal
├── components/           # Componentes React
│   ├── ui/               # Componentes de UI básicos
│   └── ...               # Componentes específicos da aplicação
├── contexts/             # Contextos React
├── hooks/                # Hooks personalizados
├── lib/                  # Utilitários e funções auxiliares
├── utils/                # Funções utilitárias
└── public/               # Arquivos estáticos
```

## ⚠️ Solução de problemas

### Problemas com APIs de tradução

Se você encontrar erros ao usar as APIs de tradução:

1. **Google Translate**: Verifique se sua chave de API está correta e se a API está ativada no console do Google Cloud.
2. **LibreTranslate**: A API pública pode ter limites de uso. Considere:

1. Usar uma instância própria do LibreTranslate
2. Verificar se a URL da API está correta
3. Usar o proxy interno da plataforma para contornar problemas de CORS


### Erros de CORS

Se encontrar erros de CORS ao usar o LibreTranslate:

1. A plataforma inclui um proxy interno para contornar esses problemas
2. Certifique-se de que a URL da API está configurada corretamente
3. Se estiver usando sua própria instância, configure o CORS adequadamente


## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request


## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Shadcn/UI](https://ui.shadcn.com/) - Componentes de UI
- [LibreTranslate](https://libretranslate.com/) - API de tradução de código aberto
- [Google Cloud Translation](https://cloud.google.com/translate) - API de tradução do Google
