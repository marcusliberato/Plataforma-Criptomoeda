# Plataforma Criptomoeda

Aplicacao React Native com Expo e suporte web para exibicao de dados publicos das exchanges Binance e Bybit.

O projeto esta em fluxo Expo managed. As pastas nativas `android/` e `ios/` nao ficam mais versionadas; se voce precisar delas novamente para builds customizados, gere com `npx expo prebuild`.

## Recursos

- Ultimo preco por exchange selecionada
- Livro de ofertas (bids/asks)
- Lista de pares por exchange com paginacao
- Gesture mobile de swipe horizontal nas listas para trocar pagina
- Navegacao entre as paginas `Inicio` e `Mercado`
- Sistema de autenticacao com JWT para acessar paginas internas
- Integracao com camera nativa e Image Picker para galeria no dispositivo
- Tratativas especificas para iOS e Android no fluxo mobile

## Autenticacao

As paginas internas exigem login via API JWT.

- Endpoint de login: `POST /api/auth/login`
- Endpoint de validacao: `GET /api/auth/me`

Credenciais padrao do backend:

- Usuario: `aluno`
- Senha: `tpcriptomoeda`

Variaveis para autenticacao no `.env`:

- `AUTH_API_PORT`
- `AUTH_USER`
- `AUTH_PASSWORD`
- `AUTH_JWT_SECRET`
- `AUTH_JWT_EXPIRES_IN`
- `AUTH_ALLOWED_ORIGINS`
- `VITE_AUTH_API_BASE_URL` (opcional, web)
- `EXPO_PUBLIC_AUTH_API_BASE_URL` (opcional, Expo/mobile)

Se estiver usando celular fisico, defina `EXPO_PUBLIC_AUTH_API_BASE_URL` com o IP da maquina na rede local, por exemplo:

```bash
EXPO_PUBLIC_AUTH_API_BASE_URL=http://192.168.0.10:8787
```

No emulador Android o app tenta usar `http://10.0.2.2:8787` automaticamente. No Expo Go em celular fisico, o app tambem tenta aproveitar o host do bundler para chegar ate a API local, mas a variavel acima continua sendo a forma mais segura.

## API de Autenticacao

```bash
npm install
npm run api
```

## Desenvolvimento

Web com Vite:

```bash
npm run web
```

Expo para app nativo:

```bash
npm start
npm run android
npm run ios
```

Suba a API de autenticacao em um terminal e o web ou o app Expo em outro.
