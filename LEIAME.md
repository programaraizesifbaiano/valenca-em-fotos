# Valença em Fotos

Site público do acervo fotográfico comunitário de Valença.

**Não há banco de dados nem área administrativa.** Tudo fica na conta Google do projeto:

- **Fotos originais**: numa pasta do Google Drive, em alta resolução.
- **Catálogo**: numa planilha do Google, que os alunos preenchem.
- **Site**: lê a planilha publicada e mostra o catálogo. É só HTML/CSS/JS, publicado no GitHub Pages.

O que os alunos alteram na planilha aparece no site em **até uns 5 minutos** (é o tempo que o Google
leva para atualizar a versão publicada).

| Arquivo | O que é |
|---|---|
| `index.html` | A página (topo, números, acervo, sobre, contribua) |
| `app.js` | Lê a planilha e monta o catálogo, os filtros e o visualizador de fotos |
| `estilo.css` | Visual |
| `config.js` | **Link da planilha publicada** |
| `exemplo.csv` | Fotos de demonstração, usadas enquanto o `config.js` não tem link |
| `catalogo.xlsx` | Planilha modelo para subir no Drive |

---

## 1. Subir a planilha (uma vez só)

A planilha já está pronta: **`catalogo.xlsx`** (nesta pasta).

Sugestão de organização no Drive do projeto:

```
Valença em Fotos/     ← privada
├── catalogo          ← a planilha (privada, no formato Planilhas Google)
└── Fotos/            ← "Qualquer pessoa com o link" (só esta pasta)
```

A planilha fica **fora** da pasta `Fotos`: tudo o que está dentro de uma pasta compartilhada herda o compartilhamento.

1. Arraste o `.xlsx` para a pasta `Valença em Fotos/` no Drive.
2. Abra o arquivo e vá em **Arquivo → Salvar como Planilhas Google**. Isso é **obrigatório**: só planilhas do
   Google podem ser publicadas na web. Depois, apague o `.xlsx` do Drive para ninguém editar o arquivo errado.

A planilha tem três abas:

| Aba | Para quê |
|---|---|
| **Catálogo** | Onde os alunos trabalham: uma linha por foto. A linha 2 é um exemplo (pode apagar). |
| **Site** | Automática: mostra só as fotos com *Autorização de uso = Sim*, e só os campos públicos. **Não editar.** |
| **Como preencher** | Instruções para os alunos. |

Colunas da aba Catálogo (as cores do cabeçalho indicam: marrom = vai para o site, verde = controle, cinza = interno):

| Coluna | Campo | Vai para o site? | Como preencher |
|---|---|---|---|
| A | Código | sim | Código da foto no acervo, no padrão da equipe (ex.: *VAL-0001*) |
| B | Título | sim | Ex.: *Procissão na Praça da Matriz* |
| C | Link da foto | sim | Link de compartilhamento da foto no Drive (ver seção 3) |
| D | Ano | sim | Ex.: *1955*. Em branco se não souber |
| E | Mês | sim | Escolhido na lista (*Junho*). Em branco se não souber |
| F | Dia | sim | 1 a 31. Em branco se não souber |
| G | Local | sim | Ex.: *Rua Direita, em frente à igreja* |
| H | Descrição | sim | O que aparece na foto |
| I | Relato | sim | O que o responsável contou sobre a foto (aparece como "Memória") |
| J | Acervo de | sim | Nome da pessoa/família que cedeu a foto |
| K | Contato do responsável | **não** | Telefone/e-mail (dado pessoal, nunca vai ao site) |
| L | Autorização de uso | controle | **Sim** = termo assinado, e a foto aparece no site. *Não* ou vazio = não aparece |

**Data:** preencha só o que souber. O site mostra exatamente isso: *15 de agosto de 1962*, *junho de 1955*
ou *1955*. Sem ano, a foto aparece no filtro "Sem data".

**Não apague, renomeie nem mude a ordem das colunas**: a aba Site e o site leem nessa ordem.

Recomendado: clique com o botão direito na aba **Site → Proteger página** e deixe só você/o professor editando.
A aba Site está pronta para 2000 fotos; para mais, copie a última linha dela para baixo.

## 2. Publicar a aba "Site"

1. **Arquivo → Compartilhar → Publicar na web**.
2. Em "Link", escolha a aba **Site** (não "Documento inteiro") e o formato **Valores separados por vírgula (.csv)**.
3. Clique em **Publicar** e copie o link.
4. Cole o link no `config.js`, em `PLANILHA_CSV_URL`.

A planilha continua **privada**: o público só consegue ver a aba "Site", que não tem contatos nem observações.
Para editar, os alunos precisam ser convidados pelo botão **Compartilhar** normal, como editores.

---

## 3. Fluxo de trabalho dos alunos

1. Digitalizar a foto e subir o **original** na pasta do Drive do projeto.
2. No Drive: botão direito na foto → **Compartilhar** → Acesso geral: **"Qualquer pessoa com o link"** → **Copiar link**.
   (Sem isso a foto não aparece no site.)
3. Na planilha, aba **Catálogo**: preencher uma linha nova, colando o link na coluna C.
4. Quando o termo de autorização estiver assinado, colocar **Sim** em **Autorização de uso**. A foto entra no site.

Dica: com a pasta `Fotos` compartilhada como "Qualquer pessoa com o link", cada foto nova colocada nela já entra
compartilhada, e o passo 2 vira só **Copiar link**.

## Publicação (GitHub Pages)

O site é publicado pelo **GitHub Pages**, direto do repositório `programaraizesifbaiano/valenca-em-fotos`
(branch `main`, pasta raiz). Endereço: **https://programaraizesifbaiano.github.io/valenca-em-fotos/**

- Cada alteração enviada ao GitHub (`git push`) publica uma versão nova em ~1 minuto.
- Fotos e fichas novas **não** precisam de nada disso: o site lê direto da planilha.
- O plano gratuito do Pages exige repositório **público**. Não há nada sigiloso no código
  (o link da planilha publicada já é público; contatos ficam só na aba privada da planilha).

Para ver no computador antes:
```
python3 -m http.server 8000
```
e abrir http://localhost:8000.

## Links diretos para cada foto

Cada foto tem endereço próprio, que pode ser compartilhado (ex.: `…/#foto-VAL-0012` abre a foto VAL-0012).
Por isso, **não reaproveite nem troque códigos** depois que a foto for publicada.

## Segurança dos dados

- Tudo fica na conta Google do projeto. Se alguém apagar algo sem querer:
  **Arquivo → Histórico de versões** na planilha, ou a **Lixeira** do Drive (30 dias).
- Contatos dos doadores são dados pessoais (LGPD). Eles ficam só na aba "Catálogo", que é privada.

## Para a prefeitura

Basta transferir a planilha e a pasta de fotos (ou o acesso à conta do projeto) e o repositório do site.
Se um dia quiserem um sistema próprio, a planilha pode ser baixada (Arquivo → Fazer download → .xlsx/.csv) e importada.
