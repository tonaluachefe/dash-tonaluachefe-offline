# Como Publicar no GitHub

## Passo 1: Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em "New repository" (ou vá em https://github.com/new)
3. Escolha um nome para o repositório (ex: `dash-tonaluachefe-offline`)
4. **NÃO** inicialize com README, .gitignore ou license (já temos isso)
5. Clique em "Create repository"

## Passo 2: Conectar ao Repositório Remoto

Após criar o repositório no GitHub, execute os seguintes comandos no terminal (substitua `SEU_USUARIO` e `NOME_DO_REPO`):

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git

# Verificar se foi adicionado corretamente
git remote -v
```

## Passo 3: Fazer Push para o GitHub

```bash
# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

Se pedir autenticação:
- **Token de acesso pessoal**: Use um Personal Access Token do GitHub
- Para criar: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

## Comandos Úteis

```bash
# Ver status do repositório
git status

# Ver histórico de commits
git log --oneline

# Adicionar mudanças futuras
git add .
git commit -m "Descrição das mudanças"
git push

# Ver branches
git branch
```

## ⚠️ Importante

- **NÃO** faça commit de arquivos sensíveis (senhas, tokens, etc.)
- O arquivo `.gitignore` já está configurado para ignorar arquivos temporários
- As credenciais admin estão ofuscadas no código, mas mesmo assim mantenha o repositório privado se possível

