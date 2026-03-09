# Guia de Contribuição — Censo Escolar Tocantins

Este documento explica como configurar o ambiente, fazer alterações e enviar um Pull Request para o repositório principal.

---

## Dono do Repositório

| Campo       | Informação                        |
|-------------|-----------------------------------|
| GitHub      | [@leidson1](https://github.com/leidson1) |
| E-mail      | leidson.lima@gmail.com            |
| Repositório | https://github.com/leidson1/censo-escolar-tocantins |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (`gh`) instalado e autenticado

Para autenticar no GitHub CLI:
```bash
gh auth login
```
Escolha `GitHub.com` → `HTTPS` → autentique com seu token ou navegador.

---

## 1. Clonando o Repositório

```bash
git clone https://github.com/leidson1/censo-escolar-tocantins.git
cd censo-escolar-tocantins
npm install
```

---

## 2. Criando sua Branch de Trabalho

Nunca trabalhe diretamente na branch `master`. Crie uma branch com seu nome ou feature:

```bash
git checkout -b meu-nome/minha-feature
```

Exemplo:
```bash
git checkout -b jabson/atualiza-pagina-1-etapa
```

---

## 3. Fazendo Alterações e Commitando

Após suas alterações:

```bash
git add .
git commit -m "feat: descrição das alterações feitas"
```

**Padrão de mensagens de commit:**
| Tipo      | Uso                                      |
|-----------|------------------------------------------|
| `feat:`   | Nova funcionalidade                      |
| `fix:`    | Correção de bug                          |
| `chore:`  | Atualização de configs/dependências      |
| `docs:`   | Atualização de documentação              |
| `style:`  | Mudanças de estilo/layout                |

---

## 4. Enviando para o GitHub

```bash
git push origin nome-da-sua-branch
```

---

## 5. Criando o Pull Request via GitHub CLI

> **Importante:** Use sempre `--no-maintainer-edit` para evitar que o comando fique travado aguardando input interativo.

```bash
gh pr create \
  --title "feat: resumo das suas alterações" \
  --body "Descrição detalhada do que foi feito." \
  --base master \
  --head nome-da-sua-branch \
  --no-maintainer-edit
```

Para verificar se o PR foi criado:
```bash
gh pr list --repo leidson1/censo-escolar-tocantins
```

Para ver detalhes do PR criado:
```bash
gh pr view --repo leidson1/censo-escolar-tocantins
```

---

## 6. Aguardando Revisão

Após criar o PR, o dono do repositório (`@leidson1`) será notificado automaticamente pelo GitHub. 

Se quiser adicionar o revisor manualmente:
```bash
gh pr edit <numero-do-pr> --add-reviewer leidson1
```

---

## Rodando o projeto localmente

```bash
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## Dúvidas?

Entre em contato com o dono do projeto: **leidson.lima@gmail.com**
