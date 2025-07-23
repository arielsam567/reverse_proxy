# Scope Proxy

Proxy para múltiplas APIs, configurável via variáveis de ambiente.

## Visão Geral

Este projeto é um servidor Node.js usando Express que atua como proxy para diversas APIs, facilitando o roteamento e o desenvolvimento local. Os endpoints e suas URLs são definidos no arquivo `.env`.

## Instalação

1. Clone o repositório.
2. Instale as dependências:

   ```sh
   npm install
   ```

3. Configure o arquivo `.env` com os endpoints desejados.

## Configuração

O arquivo `.env` define as URLs das APIs e o prefixo de cada proxy. Exemplo:

```properties
SCOPE_QA_API=https://scope.weg.net
STUDIO_QA_API=https://studio.weg.net
MODEL_QA_API=https://model.weg.net
EDB_QA_API=https://edb.weg.net
TASK_API=http://dcdev039184:30639

SCOPE_DEV_API=https://scope-dev.weg.net
STUDIO_DEV_API=https://studio-dev.weg.net
MODEL_DEV_API=https://model-dev.weg.net
EDB_DEV_API=https://edb-dev.weg.net

URL="SCOPE_QA_API,STUDIO_QA_API,MODEL_QA_API,EDB_QA_API,TASK_API,SCOPE_DEV_API,STUDIO_DEV_API,MODEL_DEV_API,EDB_DEV_API"

PORT=3005
```

A variável `URL` lista os nomes das variáveis de ambiente que serão usadas como endpoints proxy.

## Uso

Para iniciar o servidor:

```sh
npm run dev
```

O servidor irá rodar na porta definida por `PORT` (padrão: 3005).

### Endpoints

- `/ping`: Health check do servidor.
- `/{prefix}`: Proxy para o endpoint configurado. O prefixo é gerado a partir do nome da variável de ambiente (ex: `scope_qa_api`).

Exemplo de requisição:

```sh
curl http://localhost:3005/scope_qa_api/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP
```

## Desenvolvimento

Para debug, utilize o