# zSuite REST API


### `Run API locally`

1. Use the docker-compose file to create the containers for the dependencies.

```bash
docker compose up
```

2. In `config.devnet.yaml` add to swagger `- http://localhost:3000`.

3. Set the environment variables in `.env` file.

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=example
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
CHECK_OFFERS_CRON_SCHEDULE="*/1 * * * *"
```

4. Run the API

```bash
npm run start:devnet:watch
```

> [!IMPORTANT]  
> In order to test the NativeAuth guarded endpoints, you need to "whitelist" in the `acceptedOrigins` section of the `config.devnet.yaml` file, the origin from which you are generating the requests.
