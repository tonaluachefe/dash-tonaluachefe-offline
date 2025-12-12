# 📤 Como Publicar no GitHub

## Opção 1: Usando o Script Automático (Recomendado)

1. **Crie o repositório no GitHub primeiro:**
   - Acesse: https://github.com/new
   - Nome sugerido: `dash-tonaluachefe-offline`
   - **IMPORTANTE**: NÃO marque "Initialize with README"
   - Clique em "Create repository"

2. **Execute o script:**
   ```powershell
   .\push-to-github.ps1 -RepoName "dash-tonaluachefe-offline"
   ```

   Ou se quiser usar outro nome:
   ```powershell
   .\push-to-github.ps1 -RepoName "seu-nome-aqui"
   ```

## Opção 2: Manualmente

Se preferir fazer manualmente:

```powershell
# 1. Adicionar remote (substitua SEU_USUARIO e NOME_DO_REPO)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git

# 2. Renomear branch
git branch -M main

# 3. Fazer push
git push -u origin main
```

## 🔐 Autenticação

Se pedir login/senha:
- **NÃO use sua senha do GitHub**
- Use um **Personal Access Token**
- Criar token: https://github.com/settings/tokens
- Permissões necessárias: `repo` (acesso completo aos repositórios)

## ✅ Verificação

Após o push, acesse:
```
https://github.com/tonaluachefe/NOME_DO_REPO
```

Seu projeto estará lá! 🎉




