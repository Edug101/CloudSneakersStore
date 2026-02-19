# Cloud Sneakers — Site (estático)

Este é um site simples para vender tênis e roupas com painel **Admin** integrado (localStorage). Tema azul/branco e logo personalizada.

## Arquivos
- `index.html` — estrutura da página
- `styles.css` — estilos (tema azul)
- `app.js` — lógica de produtos, carrinho e admin
- `assets/logo.png` — coloque aqui a sua logo (arquivo PNG)

## Como rodar
Abra o arquivo `index.html` no navegador ou use um servidor local:

### Windows (PowerShell)
1. Instale a extensão Live Server no VS Code, ou
2. Rode qualquer servidor estático. Exemplo com Python (se tiver Python instalado):

```powershell
python -m http.server 5173
```
Acesse: http://localhost:5173 e navegue até a pasta `sitetenis`.

## Admin
- Senha padrão: **admin123**
- Acesso discreto: dê **duplo clique** no ícone de usuário (ou clique com **Shift/Alt**) para abrir o painel.
- Você pode adicionar/editar/excluir produtos, exportar/importar JSON.

## Logo
- Coloque seu arquivo em `assets/logo.png`.
- Formatos suportados: PNG/JPG/WebP (recomendo PNG ou SVG se tiver).

## Integração de pagamento
Este projeto é apenas front-end. Para pagamento real (MercadoPago/PagSeguro), posso integrar depois.
