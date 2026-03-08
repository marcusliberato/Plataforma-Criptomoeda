# Plataforma Criptomoeda

Aplicacao React + Vite para exibicao de dados publicos das exchanges Binance e Bybit.

## Recursos

- Ultimo preco por exchange selecionada
- Livro de ofertas (bids/asks)
- Lista de pares por exchange com paginacao
- Gesture mobile de swipe horizontal nas listas para trocar pagina
- Navegacao entre as paginas `Inicio`, `Mercado` e `Transacoes`

## Desenvolvimento Web

```bash
npm install
npm run dev
```

## Build Web

```bash
npm run build
```

## Testes (React Testing Library + Vitest)

```bash
npm run test
npm run test:watch
```

## App Mobile Nativo (Capacitor)

O projeto ja esta configurado com Capacitor e plataforma Android.

```bash
npm run mobile:sync
npm run mobile:android
```

Para iOS (em macOS com Xcode):

```bash
npm run mobile:ios
```
